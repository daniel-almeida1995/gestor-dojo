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
        // Start loading whenever we try to fetch
        setLoading(true);

        if (!session?.user) {
            setSettings(null);
            setLoading(false);
            return;
        }

        try {
            // Use select with limit(1) instead of single() to avoid PGRST116 (0 rows) or PGRST100 (multiple rows) errors causing a hard fail
            const { data, error } = await supabase
                .from('organization_settings')
                .select('*')
                .eq('user_id', session.user.id)
                .limit(1);

            if (error) {
                console.error('Error fetching settings:', error);
            }

            if (data && data.length > 0) {
                setSettings(data[0]);
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

                // Note: We leave 'settings' as the optimistic value, but since it has id='temp', 
                // subsequent calls/logic might behave differently. 
                // Ideally, we want the App to force the user to save if it really is new.
                // But for "persistence loop" fixing, finding *any* record is key.
                // If we didn't find one, we reset to null so App redirects to onboarding.
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
