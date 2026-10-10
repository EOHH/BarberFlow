$ErrorActionPreference = 'Stop'

$psql = Get-Command psql -ErrorAction Stop
$allowedHosts = @('localhost', '127.0.0.1', '::1')
if (-not $env:PGHOST -or $allowedHosts -notcontains $env:PGHOST) {
    throw 'PGHOST must explicitly be localhost, 127.0.0.1 or ::1. Remote databases are refused.'
}
if (-not $env:PGDATABASE) {
    throw 'PGDATABASE must name a disposable local database.'
}
if ($env:PGDATABASE -notmatch '^[A-Za-z0-9_.-]+$') {
    throw 'PGDATABASE must be a plain database name, not a connection string.'
}

$connectionArgs = @('--host', $env:PGHOST, '--dbname', $env:PGDATABASE)
if ($env:PGPORT) { $connectionArgs += @('--port', $env:PGPORT) }
if ($env:PGUSER) { $connectionArgs += @('--username', $env:PGUSER) }

$testDir = $PSScriptRoot
$setup = Join-Path $testDir 'phase31_concurrency_setup.sql'
$worker = Join-Path $testDir 'phase31_concurrency_worker.sql'
$verify = Join-Path $testDir 'phase31_concurrency_verify.sql'
$cleanup = Join-Path $testDir 'phase31_concurrency_cleanup.sql'

function Invoke-PsqlFile {
    param([string]$File, [string[]]$Variables = @())
    $arguments = @($connectionArgs) + @('-X', '--set', 'ON_ERROR_STOP=1')
    foreach ($variable in $Variables) {
        $arguments += @('--set', $variable)
    }
    $arguments += @('--file', $File)
    & $psql.Source @arguments
    if ($LASTEXITCODE -ne 0) {
        throw "psql failed for $File"
    }
}

function Invoke-WorkerPair {
    param(
        [string]$Scenario,
        [string]$UserA,
        [string]$UserB,
        [string]$ShopA,
        [string]$ShopB,
        [string]$Slug
    )

    $commonA = @(
        "scenario=$Scenario", 'worker=A', "user_id=$UserA",
        "shop_name=$ShopA", "slug=$Slug", 'pre_delay_seconds=0', 'hold_seconds=2'
    )
    $commonB = @(
        "scenario=$Scenario", 'worker=B', "user_id=$UserB",
        "shop_name=$ShopB", "slug=$Slug", 'pre_delay_seconds=0.25', 'hold_seconds=0'
    )

    $jobA = Start-Job -ScriptBlock {
        param($PsqlPath, $WorkerFile, $Variables, $ConnectionArgs)
        $psqlArgs = @($ConnectionArgs) + @('-X', '--set', 'ON_ERROR_STOP=1')
        foreach ($variable in $Variables) { $psqlArgs += @('--set', $variable) }
        $psqlArgs += @('--file', $WorkerFile)
        & $PsqlPath @psqlArgs
        if ($LASTEXITCODE -ne 0) { throw 'Concurrent worker A failed.' }
    } -ArgumentList $psql.Source, $worker, (,$commonA), (,$connectionArgs)

    $jobB = Start-Job -ScriptBlock {
        param($PsqlPath, $WorkerFile, $Variables, $ConnectionArgs)
        $psqlArgs = @($ConnectionArgs) + @('-X', '--set', 'ON_ERROR_STOP=1')
        foreach ($variable in $Variables) { $psqlArgs += @('--set', $variable) }
        $psqlArgs += @('--file', $WorkerFile)
        & $PsqlPath @psqlArgs
        if ($LASTEXITCODE -ne 0) { throw 'Concurrent worker B failed.' }
    } -ArgumentList $psql.Source, $worker, (,$commonB), (,$connectionArgs)

    $jobs = @($jobA, $jobB)
    $jobs | Wait-Job | Out-Null
    $jobs | Receive-Job
    $failed = $jobs | Where-Object State -ne 'Completed'
    $jobs | Remove-Job -Force
    if ($failed) { throw "Concurrent scenario $Scenario failed." }
}

try {
    Invoke-PsqlFile -File $setup
    Invoke-WorkerPair -Scenario 'resolve' `
        -UserA '31000000-0000-0000-0000-000000000011' `
        -UserB '31000000-0000-0000-0000-000000000011' `
        -ShopA 'Concurrent Resolve' -ShopB 'Concurrent Resolve' `
        -Slug 'phase31-concurrent-resolve'
    Invoke-WorkerPair -Scenario 'complete' `
        -UserA '31000000-0000-0000-0000-000000000012' `
        -UserB '31000000-0000-0000-0000-000000000012' `
        -ShopA 'Concurrent Complete' -ShopB 'Concurrent Complete' `
        -Slug 'phase31-concurrent-complete'
    Invoke-WorkerPair -Scenario 'slug_conflict' `
        -UserA '31000000-0000-0000-0000-000000000013' `
        -UserB '31000000-0000-0000-0000-000000000014' `
        -ShopA 'Concurrent Slug A' -ShopB 'Concurrent Slug B' `
        -Slug 'phase31-concurrent-shared'
    Invoke-PsqlFile -File $verify
}
finally {
    Invoke-PsqlFile -File $cleanup
}
