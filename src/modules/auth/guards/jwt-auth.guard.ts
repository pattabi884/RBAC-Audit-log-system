import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: any, info: any){
        if(err || !user){
            throw new UnauthorizedException(
                //given a helpful message based on what went wrong 
                info?.message || 'Invalid or missing auth token',

            );
        }
        return user;
    }
}