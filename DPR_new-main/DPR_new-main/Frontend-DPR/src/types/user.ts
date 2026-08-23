export type UserRole = 'admin' | 'author' | 'public';

export interface User {
    name: string;
    role: string; // Display role name e.g. "Senior Project Officer"
    roleType: UserRole; // Internal role type for logic
    department: string;
    email: string;
    phone: string;
    location: string;
    joinDate: string;
    employeeId: string;
}
