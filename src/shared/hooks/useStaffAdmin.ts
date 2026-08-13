import { useState, useEffect } from 'react';
import { staffRepository } from '../../infrastructure/supabase/repositories/staff.repository';
import type { Barber } from '../../types';

export function useStaffAdmin() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBarbers = async () => {
    setIsLoading(true);
    try {
      const data = await staffRepository.getAllBarbers();
      setBarbers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbers();
  }, []);

  const createBarber = async (data: Partial<Barber>) => {
    try {
      await staffRepository.createBarber(data);
      await fetchBarbers(); // Recargar
    } catch (err) {
      throw err;
    }
  };

  const updateBarber = async ({ id, data }: { id: string; data: Partial<Barber> }) => {
    try {
      await staffRepository.updateBarber(id, data);
      await fetchBarbers();
    } catch (err) {
      throw err;
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      return await staffRepository.uploadAvatar(file);
    } catch (err) {
      throw err;
    }
  };

  const deleteBarber = async (id: string) => {
    try {
      await staffRepository.deleteBarber(id);
      await fetchBarbers();
    } catch (err) {
      throw err;
    }
  };

  return {
    barbers,
    isLoading,
    createBarber,
    updateBarber,
    uploadAvatar,
    deleteBarber,
    refresh: fetchBarbers
  };
}
