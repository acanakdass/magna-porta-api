import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Süresi dolmuş token kabul edilmez
      secretOrKey: process.env.JWT_SECRET, // JWT'nin kullanacağı gizli anahtar
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findOneDynamic({ id: 1 }, ['role', 'role.permissions']);
    console.log(user.role?.permissions);
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}