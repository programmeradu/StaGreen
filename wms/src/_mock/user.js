import { faker } from '@faker-js/faker';
import { sample } from 'lodash';

// ----------------------------------------------------------------------

const users = [...Array(24)].map((_unusedItem, _unusedIndex) => ({
  // Prefixed unused parameters
  id: faker.datatype.uuid(),
  // avatarUrl: `/static/mock-images/avatars/avatar_${_unusedIndex + 1}.jpg`, // If index was used for avatar
  name: faker.name.findName(),
  company: faker.company.companyName(),
  // isVerified: faker.datatype.boolean(),
  // status: sample(['active', 'banned']),
  role: sample([
    'Leader',
    'Hr Manager',
    'UI Designer',
    'UX Designer',
    'UI/UX Designer',
    'Project Manager',
    'Backend Developer',
    'Full Stack Designer',
    'Front End Developer',
    'Full Stack Developer',
  ]),
}));

export default users;
