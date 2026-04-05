import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';

class CreateUserDto {
  email: string;
  name?: string;
}

class UpdatePreferencesDto {
  preferences: Record<string, any>;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id/preferences')
  @ApiOperation({ summary: 'Update user preferences' })
  updatePreferences(@Param('id') id: string, @Body() body: UpdatePreferencesDto) {
    return this.usersService.updatePreferences(id, body.preferences);
  }
}
