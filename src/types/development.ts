export type DevelopmentStatus = 'planning' | 'construction' | 'completed' | 'sold_out';

export interface DeveloperInfo {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    phone: string;
    image: string | null;
    role: string;
}

export interface Development {
    id: number;
    name: string;
    name_am: string;
    developer_name: string;
    developer_name_am: string;
    logo: string;
    master_plan_image: string;
    description: string;
    description_am: string;
    location: string;
    location_am: string;
    status: DevelopmentStatus;
    delivery_period: string;
    delivery_period_am?: string;
    amenities?: string[];
    amenities_am?: string[];
    approval_status: string;
    seller: number;
    seller_details: DeveloperInfo;
    count_units: number;
    created_at: string;
    updated_at: string;
}