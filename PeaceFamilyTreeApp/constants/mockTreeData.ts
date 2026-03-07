export interface TreeMember {
  id: string;
  name: string;
  role?: string;
  dates?: string;
  subTitle?: string;
  imageUrl?: string;
}

export const mockTreeData = {
  parents: [
    {
      id: 'parent-1',
      name: 'John Adams',
      role: 'FATHER',
      dates: '1735–1826',
      imageUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Gilbert_Stuart_John_Adams.jpg/480px-Gilbert_Stuart_John_Adams.jpg',
    },
    {
      id: 'parent-2',
      name: 'Abigail Smith',
      role: 'MOTHER',
      dates: '1744–1818',
      imageUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Abigail_Adams.jpg/480px-Abigail_Adams.jpg',
    },
  ],
  mainAncestor: {
    id: 'main-1',
    name: 'John Quincy Adams',
    role: 'DIRECT ANCESTOR',
    subTitle: '6TH U.S. PRESIDENT',
    dates: '1767–1848',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/John_Quincy_Adams_by_George_Caleb_Bingham%2C_1844.jpg/480px-John_Quincy_Adams_by_George_Caleb_Bingham%2C_1844.jpg',
  },
  children: [
    {
      id: 'child-1',
      name: 'George W. Adams',
      dates: '1801–1829',
      imageUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/George_Washington_Adams_by_Charles_Bird_King.jpg/480px-George_Washington_Adams_by_Charles_Bird_King.jpg',
    },
    {
      id: 'current-user', // Mocking the current user
      name: 'Me',
      dates: '1803–1834',
      imageUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/John_Adams_II_by_Charles_Bird_King.jpg/480px-John_Adams_II_by_Charles_Bird_King.jpg',
    },
  ],
};
