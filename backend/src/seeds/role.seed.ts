import { Model } from 'mongoose';
import { roles } from 'src/common/helpers/data.helper';
import { Role } from 'src/resources/users/role/entities/role.entity';

export const rolesSeed = async (Role: Model<Role>) => {
  const countDocument = await Role.countDocuments();

  if (countDocument) return;

  await Role.insertMany(roles);

  console.log('Role Seeded Successfully');
};
