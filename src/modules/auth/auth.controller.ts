// src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '@infrastructure/database/schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';



@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
   
    private jwtService: JwtService,

    
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  
  @Public()
  @Post('register')
  async register(@Body() body: { email: string; name: string; password: string }) {
    this.logger.log(`Register attempt for email: ${body.email}`);

    // Check if email already exists
    const existing = await this.userModel.findOne({ email: body.email });
    if (existing) {
      throw new UnauthorizedException('Email already registered');
    }

   
    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = new this.userModel({
      email: body.email,
      name: body.name,
      passwordHash,
    });

    const saved = await user.save();
    this.logger.log(`User registered successfully: ${saved.email}`);

    // Never return the passwordHash to the client
    return {
      message: 'User registered successfully',
      userId: saved._id,
      email: saved.email,
      name: saved.name,
    };
  }

  
  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    this.logger.log(`Login attempt for email: ${dto.email}`);

    // Step 1: Find user by email
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) {
      this.logger.warn(`Login failed — email not found: ${dto.email}`);
     
      throw new UnauthorizedException('Invalid credentials');
    }

    // Step 2: Check if account is active
    if (!user.isActive) {
      this.logger.warn(`Login failed — account deactivated: ${dto.email}`);
      throw new UnauthorizedException('Account is deactivated');
    }

    
    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      this.logger.warn(`Login failed — wrong password for: ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

 
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      loginTime: new Date(),
    };

    const token = this.jwtService.sign(payload);
    this.logger.log(`Login successful for: ${dto.email}`);

    // Update last login timestamp — fire and forget
    await this.userModel.findByIdAndUpdate(user._id, {
      $set: { lastLoginAt: new Date() },
    });

    return {
      access_token: token,
      userId: user._id,
      email: user.email,
      name: user.name,
    };
  }
}