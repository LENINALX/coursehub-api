import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { FindStudentsQueryDto } from './dto/find-students-query.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { UpdateStudentStatusDto } from './dto/update-student-status.dto.js';
import { ParseStudentIdPipe } from './pipes/parse-student-id.pipe.js';
import { StudentsService } from './students.service.js';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  findAll(@Query() filters: FindStudentsQueryDto) {
    return this.studentsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseStudentIdPipe) id: number) {
    return this.studentsService.findOne(id);
  }

  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseStudentIdPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseStudentIdPipe) id: number,
    @Body() updateStudentStatusDto: UpdateStudentStatusDto,
  ) {
    return this.studentsService.updateStatus(id, updateStudentStatusDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseStudentIdPipe) id: number) {
    return this.studentsService.remove(id);
  }
}