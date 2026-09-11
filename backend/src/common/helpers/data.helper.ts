import { USER_STATUS } from 'src/resources/users/user/enums/user.enum';

export const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const shortMonths = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const uploadingType = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const defaultImages = ['default.jpg', 'default.png', null, undefined];

export const IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

export const adminData = {
  firstName: 'baman',
  lastName: 'baman',
  email: 'boiler-plate_admin@yopmail.com',
  photo: 'default.png',
  status: USER_STATUS.ACTIVE,
  password:"$2b$12$uGvb9hm8VM7ODOcgyYbH2eIzl4F6T2YoWhmc8/cfIjADjKtuJWKgq"
};

export const roles = [
  {
    name: 'super-admin',
    permission: [],
    isDefault: true,
  },
  {
    name: 'user',
    permission: [],
    isDefault: true,
  },
];

export const allowedPorts = [
  'http://localhost:3001',
  'https://localhost:3001',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:4000',
  'http://localhost:4001',
  'https://adbuilder-admin-opal.vercel.app',
  'https://adbuilder-web.vercel.app',
];
