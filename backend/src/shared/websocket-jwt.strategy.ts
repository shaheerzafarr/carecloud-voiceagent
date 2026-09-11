// // websocket-jwt.strategy.ts
// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { InjectModel } from '@nestjs/mongoose';
// import { PassportStrategy } from '@nestjs/passport';
// import { Model } from 'mongoose';
// import { Strategy } from 'passport-jwt';
// import { Socket } from 'socket.io';
// import {
//   userPopulate,
//   userValidationHandling,
// } from 'src/common/helpers/helper';
// import { IUser, User } from 'src/resource/users/user/entities/user.entity';

// @Injectable()
// export class WsJwtStrategy extends PassportStrategy(Strategy, 'ws-jwt') {
//   constructor(
//     @InjectModel(User.name) private readonly User: Model<IUser>,
//     private readonly configService: ConfigService,
//   ) {
//     super({
//       jwtFromRequest: (client: Socket) => {
//         const token = client.handshake.auth?.token;
//         return token?.startsWith('Bearer ') ? token.split(' ')[1] : token;
//       },
//       secretOrKey: configService.get('JWT_SECRET'),
//       passReqToCallback: true,
//     });
//   }

//   async validate(req: any, payload: any) {
//     const { id, iat } = payload;

//     const user = await this.User.findById(id).populate(userPopulate).lean();

//     if (!user) throw new UnauthorizedException('User not found');

//     const [err] = userValidationHandling(user, iat);

//     if (err) throw err;

//     user.passwordChangedAt = undefined;
//     user.password = undefined;

//     return user;
//   }
// }
