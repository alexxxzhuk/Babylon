export interface LoginResponse {
    access_token: string
    refresh_token: string
  }
  
  export interface MeResponse {
    user: {
      first_name: string
      last_name: string
    }
  }

  export interface Chat {
    chat_id: string
    participants: {
      id: number
      first_name: string
      last_name: string
    }[]
  }