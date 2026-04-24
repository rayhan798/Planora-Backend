import { Role } from "../../generated/prisma/enums";

export interface IRequestUser{
    id?: number | string;
    userId : string;
    role : Role;
    email : string;
    name: string;
}