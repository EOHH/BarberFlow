import { sileo, type SileoOptions } from 'sileo';

export type NotificationKind = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  description?: string;
  duration?: number | null;
}

export type NotificationId = string;

const toSileoOptions = (title: string, options?: NotificationOptions): SileoOptions => {
  const sileoOptions: SileoOptions = { title };
  if (options?.description !== undefined) sileoOptions.description = options.description;
  if (options?.duration !== undefined) sileoOptions.duration = options.duration;
  return sileoOptions;
};

const show = (kind: NotificationKind, title: string, options?: NotificationOptions): NotificationId => {
  return sileo[kind](toSileoOptions(title, options));
};

export const notifications = {
  success(title: string, options?: NotificationOptions) {
    return show('success', title, options);
  },
  error(title: string, options?: NotificationOptions) {
    return show('error', title, options);
  },
  warning(title: string, options?: NotificationOptions) {
    return show('warning', title, options);
  },
  info(title: string, options?: NotificationOptions) {
    return show('info', title, options);
  },
  loading(title: string, options?: Omit<NotificationOptions, 'duration'>) {
    return sileo.show({ ...toSileoOptions(title, options), type: 'loading', duration: null });
  },
  update(id: NotificationId, kind: NotificationKind, title: string, options?: NotificationOptions) {
    sileo.dismiss(id);
    return show(kind, title, options);
  },
  close(id: NotificationId) {
    sileo.dismiss(id);
  },
  clear() {
    sileo.clear();
  },
};
