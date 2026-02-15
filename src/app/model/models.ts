export type UserDto = {

    userId?:string,
    userName?:string,
    userPassword?:string,
    userEmail?:string,
    role?:Role,
    enabled?:boolean;

}

export type AuthUserResponse = {

    token:string,
    userDto:UserDto
}

export type DoctorDto = {

    doctorId?:string,
    doctorName?:string,
    doctorAddress?:string,
    cabinetName?:string,
    doctorEmail?:string,
    doctorPhone?:string,
    doctorSpecialty?:string,
    doctorDescription?:string,
}

export type AppointmentDto = {
  appointmentId?: string;  
  doctorDto: DoctorDto;
  patientId: string;      
  startAt: string;        
  endAt: string;    
  status?: AppointStatus;
}

export enum Role {

    ADMIN,
    USER

}

export enum AppointStatus {

    RESERVED,
    CANCELLED,
}