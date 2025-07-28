import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ExternalService {
  async getSomethingFromExternal() {
    const res = await axios.get('https://third-party.com/api');
    return res.data;
  }
}