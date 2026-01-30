import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { OrganizationSettings } from '../types';

interface SettingsContextType {
    settings: OrganizationSettings | null;
    loading: boolean;
    refreshSettings: () => Promise<void>;
    updateSettings: (newSettings: Partial<OrganizationSettings>) => Promise<void>;
}

const defaultSettings: OrganizationSettings = {
    id: '',
    user_id: '',
    school_name: 'Minha Escola',
    default_monthly_fee: 150.00,
    default_due_day: 10,
    currency_symbol: 'R$',
};

const SettingsContext = createContext<SettingsContextType>({
    settings: null,
    loading: true,
    refreshSettings: async () => { },
    updateSettings: async () => { },
});

export const SettingsProvider = ({ children }: { children?: React.ReactNode }) => {
    const { session } = useAuth();
    const [settings, setSettings] = useState<OrganizationSettings | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        if (!session?.user) {
            setSettings(null);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('organization_settings')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
                console.error('Error fetching settings:', error);
            }

            if (data) {
                setSettings(data);
            } else {
                // Init default settings if none exist
                const newSettings = {
                    user_id: session.user.id,
                    school_name: 'Minha Escola',
                    default_monthly_fee: 150.00,
                    default_due_day: 10,
                    currency_symbol: 'R$'
                };

                // Optimistic update
                setSettings({ ...newSettings, id: 'temp' } as OrganizationSettings);

                // Currently we are NOT auto-creating settings here effectively
                // We let the /settings page or a dedicated init step do it
                // Or we treat null settings as "Needs Onboarding"
                setSettings(null);
            }
        } catch (err) {
            console.error('Unexpected error in settings:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, [session]);

    const updateSettings = async (newSettings: Partial<OrganizationSettings>) => {
        if (!session?.user) return;

        // Optimistic update
        setSettings(prev => prev ? { ...prev, ...newSettings } : null);

        try {
            if (!settings?.id) {
                // Create
                const { data, error } = await supabase
                    .from('organization_settings')
                    .insert([{
                        user_id: session.user.id,
                        ...newSettings
                    }])
                    .select()
                    .single();

                if (error) throw error;
                if (data) setSettings(data);

            } else {
                // Update
                const { error } = await supabase
                    .from('organization_settings')
                    .update(newSettings)
                    .eq('id', settings.id);

                if (error) throw error;
            }

        } catch (err) {
            console.error("Failed to update settings:", err);
            // Revert? For now just log
            await fetchSettings();
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    return useContext(SettingsContext);
};
