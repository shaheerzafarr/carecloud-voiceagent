import { Model } from 'mongoose';
import { adminData } from 'src/common/helpers/data.helper';
import { Role } from 'src/resources/users/role/entities/role.entity';
import { ROLES } from 'src/resources/users/role/enums/role.enum';
import { User } from 'src/resources/users/user/entities/user.entity';

export const adminSeed = async (User: Model<User>, Role: Model<Role>) => {
  const admin = adminData;

  const isAdminExist = await User.findOne({ email: admin.email });

  if (isAdminExist) return;

  const adminRole = await Role.findOne({ name: ROLES.SUPER_ADMIN });

  if (!adminRole) return;

  await User.create({
    ...admin,
    role: adminRole._id as any,
  });

  console.log('Users seeded');
};
