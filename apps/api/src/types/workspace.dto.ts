interface Avatar {
    icon:string
    color:string
}

interface CreateWorkspaceDTO {
    name:string
    avatar: Avatar
    userId?:string;
    guestId?:string;
}

export type {
    CreateWorkspaceDTO  
}