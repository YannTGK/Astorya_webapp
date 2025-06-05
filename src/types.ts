// Globale, herbruikbare types
export interface StarData {
    _id: string
    publicName: string
    x: number
    y: number
    z: number
    color: string
    related?: boolean
    user?: {
      dob?: string
      dod?: string
      country?: string
    }
  }