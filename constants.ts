import { BarberUnit } from './types';

export const MOCK_UNITS: BarberUnit[] = [
  {
    id: '1',
    name: 'Barbearia Vintage - Centro',
    address: 'Rua das Flores, 123, Centro',
    rating: 4.8,
    imageUrl: 'https://picsum.photos/800/600?random=1',
    coordinates: { lat: -23.5505, lng: -46.6333 },
    description: 'A melhor experiência old school da cidade. Cerveja gelada e toalha quente.',
    phone: '(11) 99999-9999',
    openingHours: 'Seg - Sáb: 09:00 - 20:00',
    services: [
      { id: 's1', name: 'Corte de Cabelo', price: 50, durationMin: 45, description: 'Corte clássico ou moderno com acabamento na navalha.' },
      { id: 's2', name: 'Barba Completa', price: 40, durationMin: 30, description: 'Barba terapia com toalha quente e óleos essenciais.' },
      { id: 's3', name: 'Combo (Corte + Barba)', price: 80, durationMin: 75, description: 'O pacote completo para o homem moderno.' },
      { id: 's4', name: 'Pezinho e Sobrancelha', price: 20, durationMin: 15, description: 'Acabamento rápido.' },
    ],
    professionals: [
      { id: 'p1', name: 'Carlos Silva', role: 'Master Barber', photoUrl: 'https://picsum.photos/200/200?random=10' },
      { id: 'p2', name: 'André Souza', role: 'Barbeiro', photoUrl: 'https://picsum.photos/200/200?random=11' },
      { id: 'p3', name: 'Marcos Dias', role: 'Colorista', photoUrl: 'https://picsum.photos/200/200?random=12' },
    ],
    subscriptions: [
      { id: 'sub1', name: 'Clube do Corte', price: 99.90, benefits: ['Cortes ilimitados', '10% off em produtos'] },
      { id: 'sub2', name: 'Clube Vip', price: 149.90, benefits: ['Cortes e Barba ilimitados', 'Bebida grátis', 'Prioridade na agenda'] },
    ],
    reviews: [
      { id: 'r1', author: 'João Pedro', rating: 5, comment: 'Melhor corte da região!', date: '2023-10-15' },
      { id: 'r2', author: 'Lucas M.', rating: 4, comment: 'Ótimo serviço, mas atrasou um pouco.', date: '2023-10-10' },
    ]
  },
  {
    id: '2',
    name: 'Barber Shop Modern - Vila Madalena',
    address: 'Av. das Artes, 450, Vila Madalena',
    rating: 4.5,
    imageUrl: 'https://picsum.photos/800/600?random=2',
    coordinates: { lat: -23.5605, lng: -46.6933 },
    description: 'Estilo moderno e ambiente descontraído com mesa de sinuca.',
    phone: '(11) 98888-8888',
    openingHours: 'Ter - Dom: 10:00 - 22:00',
    services: [
      { id: 's5', name: 'Corte Degrade', price: 60, durationMin: 50, description: 'Especialistas em fade.' },
      { id: 's6', name: 'Pigmentação', price: 30, durationMin: 30, description: 'Correção de falhas.' },
    ],
    professionals: [
      { id: 'p4', name: 'Felipe Neto', role: 'Barbeiro Sênior', photoUrl: 'https://picsum.photos/200/200?random=13' },
      { id: 'p5', name: 'Gustavo Lima', role: 'Barbeiro', photoUrl: 'https://picsum.photos/200/200?random=14' },
    ],
    subscriptions: [
      { id: 'sub3', name: 'Assinatura Básica', price: 79.90, benefits: ['2 Cortes por mês', 'Barba 1x por mês'] },
    ],
    reviews: [
      { id: 'r3', author: 'Matheus', rating: 5, comment: 'Ambiente top demais.', date: '2023-09-20' },
    ]
  }
];
