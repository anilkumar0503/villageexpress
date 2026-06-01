declare module 'nodemailer' {
  import { Transport } from 'nodemailer'
  export interface Transporter {
    sendMail: (options: any) => Promise<any>
  }
  export function createTransport(options: any): Transporter
}
