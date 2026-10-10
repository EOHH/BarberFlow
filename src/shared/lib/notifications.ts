import { sileo, type SileoOptions } from 'sileo';

interface NotificationOptions {
  description?: string;
  duration?: number | null;
  id?: string;
}

const toSileoOptions = (title: string, options?: NotificationOptions): SileoOptions => ({
  title,
  description: options?.description,
  duration: options?.duration,
});

const replacePending = (id?: string) => {
  if (id) sileo.dismiss(id);
};

export const notifications = {
  success(title: string, options?: NotificationOptions) {
    replacePending(options?.id);
    return sileo.success(toSileoOptions(title, options));
  },
  error(title: string, options?: NotificationOptions) {
    replacePending(options?.id);
    return sileo.error(toSileoOptions(title, options));
  },
  warning(title: string, options?: NotificationOptions) {
    replacePending(options?.id);
    return sileo.warning(toSileoOptions(title, options));
  },
  info(title: string, options?: NotificationOptions) {
    replacePending(options?.id);
    return sileo.info(toSileoOptions(title, options));
  },
  loading(title: string, options?: Omit<NotificationOptions, 'duration'>) {
    return sileo.show({ ...toSileoOptions(title, options), type: 'loading', duration: null });
  },
  dismiss(id: string) {
    sileo.dismiss(id);
  },
};
