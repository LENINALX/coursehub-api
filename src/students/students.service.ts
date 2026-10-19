import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { FindStudentsQueryDto } from './dto/find-students-query.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { UpdateStudentStatusDto } from './dto/update-student-status.dto.js';

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

  findAll(filters: FindStudentsQueryDto): Promise<Student[]> {
    return this.studentsRepository.find({
      where: {
        ...(filters.career ? { career: filters.career } : {}),
        ...(filters.semester ? { semester: Number(filters.semester) } : {}),
        ...(filters.isActive !== undefined
          ? { isActive: filters.isActive === 'true' }
          : {}),
      },
      order: { id: 'ASC' },
    });
  }

  async create(dto: CreateStudentDto): Promise<Student> {
    await this.ensureEmailAvailable(dto.email);
    return this.studentsRepository.save(this.studentsRepository.create(dto));
  }

  async update(id: number, dto: UpdateStudentDto): Promise<Student> {
    const student = await this.findOne(id);
    if (dto.email) await this.ensureEmailAvailable(dto.email, id);
    Object.assign(student, dto);
    return this.studentsRepository.save(student);
  }

  async updateStatus(
    id: number,
    dto: UpdateStudentStatusDto,
  ): Promise<Student> {
    const student = await this.findOne(id);
    student.isActive = dto.isActive;
    return this.studentsRepository.save(student);
  }

  async remove(id: number): Promise<Student> {
    const student = await this.findOne(id);
    if (!student.isActive) {
      throw new ConflictException('Inactive students cannot be deleted');
    }
    await this.studentsRepository.remove(student);
    return student;
  }

  private async ensureEmailAvailable(email: string, currentId?: number) {
    const existing = await this.studentsRepository.findOneBy({ email });
    if (existing && existing.id !== currentId) {
      throw new ConflictException('Email already belongs to another student');
    }
  }
}
