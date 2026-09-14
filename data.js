/* =====================================================
   RASKOP — Shared Data & Configuration
   Digunakan oleh: index.html, reservasi.js, admin.js
   ===================================================== */

const RASKOP = {
  config: {
    totalSeats:         50,
    reservedRatio:      0.70,
    reservedSeats:      35,       // 50 * 70%
    lateToleranceMins:  15,
    minOrderPerPerson:  1,
    adminPhone:         '6281357662424',
    // ─── SLOT CONFIG ─────────────────────────────────────
    slots: {
      times: ['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'],
      defaultCapacity: 10,
    },

    // ─── KAPASITAS PER AREA ───────────────────────────────
    // indoor=30 | outdoor=45 | study=15 (area value = state.area lowercase)
    areaCapacity: {
      indoor:  30,
      outdoor: 45,
      study:   15,
    },

    // Info pembayaran
    payment: {
      qris: {
        label: 'QRIS',
        info:  'Scan QR di bawah menggunakan aplikasi apapun (GoPay, OVO, Dana, m-Banking)',
        image: 'Brand_assets/qr_ayah.jpeg',
      },
      transfer: {
        label: 'Bank Transfer',
        info:  'Transfer ke rekening berikut, konfirmasi via WA ke admin.',
        banks: [
          { name: 'BCA', no: '1342714409', an: 'Adhitya Nugraha' },
        ],
      },
      midtrans: {
        label: 'Midtrans E-Wallet',
        info:  'Admin akan mengirim link pembayaran Midtrans via WhatsApp setelah booking dikonfirmasi.',
        wallets: ['GoPay', 'OVO', 'DANA', 'ShopeePay'],
      },
    },
  },

  // ─── DATA MENU ───────────────────────────────────────
  menu: {
    kopi: [
      { id: 'k1',  emoji: '\u2615',      name: 'Americano',              desc: 'Double shot, bold & clean',        price: 18000, bestseller: false },
      { id: 'k2',  emoji: '\u{1F95B}',   name: 'Spanish Latte',          desc: 'Creamy flat, less coffee',         price: 20000, bestseller: false },
      { id: 'k3',  emoji: '\u{1F9CA}',   name: 'Americano Blackcurrent', desc: 'Favorit para mahasiswa',           price: 20000, bestseller: true  },
      { id: 'k5',  emoji: '\u2615',      name: 'V60 Single Origin',      desc: 'Manual brew, pour over, hot',      price: 25000, bestseller: false },
      { id: 'k6',  emoji: '\u{1F9CA}',   name: 'Japanese',               desc: 'Manual brew, pour over, ice',      price: 28000, bestseller: false },
      { id: 'k7',  emoji: '\u2615',      name: 'Cappuccino',             desc: 'Classic Italian style',            price: 22000, bestseller: false },
      { id: 'k8',  emoji: '\u{1F36B}',   name: 'Kopi Susu Gula Aren',    desc: 'Manis alami dari aren',            price: 20000, bestseller: true  },
      { id: 'k9',  emoji: '\u{1F95B}',   name: 'Caramel Coffee',         desc: 'Flavour, sweet, balance',          price: 22000, bestseller: true  },
      { id: 'k10', emoji: '\u{1F95B}',   name: 'Butterscotch Coffee',    desc: 'Flavour, savory, creamy',          price: 22000, bestseller: true  },
      { id: 'k11', emoji: '\u{1F9CA}',   name: 'Americano Peach',        desc: 'Unique, flat, funky',              price: 20000, bestseller: true  },
    ],
    nonkopi: [
      { id: 'n1', emoji: '\u{1F375}', name: 'Teh Tarik',     desc: 'Malaysian style, frothy',        price: 16000, bestseller: false },
      { id: 'n2', emoji: '\u{1F33F}', name: 'Matcha Latte',  desc: 'Japanese grade matcha',          price: 20000, bestseller: true  },
      { id: 'n3', emoji: '\u{1F964}', name: 'Cokelat Panas', desc: 'Rich belgian chocolate',         price: 20000, bestseller: true  },
      { id: 'n4', emoji: '\u{1F34B}', name: 'Lemon Squash',  desc: 'Segar tapi nggak kecut',         price: 18000, bestseller: false },
      { id: 'n5', emoji: '\u{1F339}', name: 'Rose Milk',     desc: 'Bunga mawar asli',               price: 20000, bestseller: false },
      { id: 'n6', emoji: '\u{1F96D}', name: 'Mango Yakult',  desc: 'Mango segar, full blend',        price: 20000, bestseller: true  },
      { id: 'n7', emoji: '\u{1F347}', name: 'Lychee Yakult', desc: 'Probiotik yang enak',            price: 20000, bestseller: false },
      { id: 'n8', emoji: '\u{1F34B}', name: 'Lemontea',      desc: 'a tangy, and refreshing taste',  price: 14000, bestseller: false },
    ],
    mocktail: [
      { id: 'mc1', emoji: '\u{1F943}', name: 'Whiskey Land',      desc: 'Coldbrew, Peach, Lemon, funky',   price: 22000, bestseller: false },
      { id: 'mc2', emoji: '\u{1F33F}', name: 'Green Hornet',      desc: 'Kiwi, creamy with whip float',    price: 22000, bestseller: true  },
      { id: 'mc3', emoji: '\u{1F964}', name: 'Americano Mocktail', desc: 'Strawberry, Americano, Lemon',   price: 22000, bestseller: true  },
    ],
    makanan: [
      { id: 'm1', emoji: '\u{1F35A}', name: 'Nasi Goreng Kampung', desc: 'Best Seller',                       price: 18000, bestseller: true  },
      { id: 'm2', emoji: '\u{1F35C}', name: 'Mie Goreng Nyemek',   desc: 'Savory, spicy noodles, thick gravy', price: 16000, bestseller: true  },
      { id: 'm4', emoji: '\u{1F35F}', name: 'Mix Platter',         desc: 'Crispy with dipping sauce',         price: 25000, bestseller: true  },
      { id: 'm5', emoji: '\u{1F34C}', name: 'Pisang Goreng',       desc: 'Crispy di luar, lembut di dalam',   price: 16000, bestseller: true  },
      { id: 'm6', emoji: '\u{1F36E}', name: 'Puding Karamel',      desc: 'Silky smooth homemade',             price: 12000, bestseller: false },
    ],
  },
};

// ─── UTILITY FUNCTIONS ────────────────────────────────
function formatRupiah(amount) {
  return 'Rp\u00A0' + Number(amount).toLocaleString('id-ID');
}


function generateReservationId() {
  const d    = new Date();
  const date = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `RSK-${date}-${rand}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

/* ─── FETCH QUOTA (via serverless function) ─────────── */
async function fetchQuota(dateStr) {
  const date = dateStr || new Date().toISOString().slice(0, 10);
  try {
    const res = await fetch(`/.netlify/functions/quota?date=${date}`);
    return await res.json();
  } catch {
    return { totalGuests: 0, reservedSeats: RASKOP.config.reservedSeats, percentage: 0 };
  }
}
