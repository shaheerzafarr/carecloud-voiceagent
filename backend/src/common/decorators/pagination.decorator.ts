import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IPagination } from '../constants/interfaces/interface';

export const Pagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IPagination => {
    const request = ctx.switchToHttp().getRequest();
    const query = request.query;

    const page = Number.parseInt(query?.page, 10) || undefined;
    const limit = Number.parseInt(query?.limit, 10) || undefined;

    if (!page || !limit)
      return {
        skip: undefined as unknown as number,
        limit: undefined as unknown as number,
      };

    const skip = (page - 1) * limit;

    return { skip, limit };
  },
);
