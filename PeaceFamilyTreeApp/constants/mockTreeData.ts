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
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&auto=format&fit=crop',
    },
    {
      id: 'parent-2',
      name: 'Abigail Smith',
      role: 'MOTHER',
      dates: '1744–1818',
      imageUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop',
    },
  ],
  mainAncestor: {
    id: 'main-1',
    name: 'John Quincy Adams',
    role: 'DIRECT ANCESTOR',
    subTitle: '6TH U.S. PRESIDENT',
    dates: '1767–1848',
    imageUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=300&auto=format&fit=crop',
  },
  children: [
    {
      id: 'child-1',
      name: 'George W. Adams',
      dates: '1801–1829',
      imageUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
    },
    {
      id: 'current-user', // Mocking the current user
      name: 'Me',
      dates: '1803–1834',
      imageUrl:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300&auto=format&fit=crop',
    },
  ],
  grandchildren: [
    {
      id: 'grandchild-1',
      name: 'Charles F. Adams',
      dates: '1807–1886',
      imageUrl:
        'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=300&auto=format&fit=crop',
    },
  ],
};

