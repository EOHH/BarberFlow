import { supabase } from '../client';

export type OnboardingStatus = 'ready' | 'needs_onboarding';

export interface OnboardingResolution {
  status: OnboardingStatus;
  tenant_id?: string;
  tenant_name?: string;
  slug?: string;
}

export class OnboardingRepository {
  async resolve(): Promise<OnboardingResolution> {
    const { data, error } = await supabase.rpc('resolve_auth_onboarding');

    if (error) throw new Error(`No se pudo verificar tu barbería: ${error.message}`);
    return data as OnboardingResolution;
  }

  async complete(shopName: string, slug: string): Promise<OnboardingResolution> {
    const { data, error } = await supabase.rpc('complete_auth_onboarding', {
      p_shop_name: shopName,
      p_slug: slug,
    });

    if (error) throw new Error(error.message);
    return data as OnboardingResolution;
  }
}

export const onboardingRepository = new OnboardingRepository();
