import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity.js';
import { CreateStudentDto } from './dto/create-student.dto.js';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,
  ) {}

  async findOne(id: number): Promise<Student> {
    const student = await this.studentsRepository.findOneBy({ id });
    if (!student) throw new NotFoundException(`Student ${id} not found`);
    return student;
  }

  async create(dto: CreateStudentDto): Promise<Student> {
    await this.ensureEmailAvailable(dto.email);
    return this.studentsRepository.save(this.studentsRepository.create(dto));
  }

  private async ensureEmailAvailable(email: string, currentId?: number) {
    const existing = await this.studentsRepository.findOneBy({ email });
    if (existing && existing.id !== currentId) {
      throw new ConflictException('Email already belongs to another student');
    }
  }
}