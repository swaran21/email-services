import { Email } from '../models/Email';

export interface IEmailProvider {
  name: string;

  send(email: Email): Promise<void>;
}