import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hash } from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing data
  await prisma.setting.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.user.deleteMany();

  // Create default settings
  await prisma.setting.createMany({
    data: [
      { key: "defaultInterestRate", value: "12" },
      { key: "maxLoanAmount", value: "100000" },
      { key: "minLoanAmount", value: "1000" },
      { key: "maxTermMonths", value: "36" },
      { key: "minTermMonths", value: "1" },
    ],
  });

  const passwordHash = await hash("password123", 10);

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      name: "Pastor Gabriel Reyes",
      email: "admin@christfollowers.ph",
      passwordHash,
      role: "ADMIN",
      phone: "0917-123-4567",
      address: "123 Rizal St, Quezon City",
      joinedAt: new Date("2023-01-15"),
    },
  });

  // Create Officers
  const officer1 = await prisma.user.create({
    data: {
      name: "Maria Santos",
      email: "maria.santos@christfollowers.ph",
      passwordHash,
      role: "OFFICER",
      phone: "0918-234-5678",
      address: "45 Mabini Ave, Makati City",
      joinedAt: new Date("2023-02-01"),
    },
  });

  const officer2 = await prisma.user.create({
    data: {
      name: "Pedro Villanueva",
      email: "pedro.villanueva@christfollowers.ph",
      passwordHash,
      role: "OFFICER",
      phone: "0919-345-6789",
      address: "78 Bonifacio Blvd, Taguig",
      joinedAt: new Date("2023-03-10"),
    },
  });

  // Create Members
  const members = await Promise.all([
    prisma.user.create({
      data: {
        name: "Juan dela Cruz",
        email: "juan.delacruz@christfollowers.ph",
        passwordHash,
        role: "MEMBER",
        phone: "0920-456-7890",
        address: "12 Sampaguita St, Pasig City",
        joinedAt: new Date("2023-03-15"),
      },
    }),
    prisma.user.create({
      data: {
        name: "Ana Garcia",
        email: "ana.garcia@christfollowers.ph",
        passwordHash,
        role: "MEMBER",
        phone: "0921-567-8901",
        address: "34 Jasmine Rd, Mandaluyong",
        joinedAt: new Date("2023-04-01"),
      },
    }),
    prisma.user.create({
      data: {
        name: "Carlos Mendoza",
        email: "carlos.mendoza@christfollowers.ph",
        passwordHash,
        role: "MEMBER",
        phone: "0922-678-9012",
        address: "56 Orchid Lane, San Juan",
        joinedAt: new Date("2023-04-15"),
      },
    }),
    prisma.user.create({
      data: {
        name: "Rosa Flores",
        email: "rosa.flores@christfollowers.ph",
        passwordHash,
        role: "MEMBER",
        phone: "0923-789-0123",
        address: "89 Dahlia St, Marikina",
        joinedAt: new Date("2023-05-01"),
      },
    }),
    prisma.user.create({
      data: {
        name: "Elena Villanueva",
        email: "elena.villanueva@christfollowers.ph",
        passwordHash,
        role: "MEMBER",
        phone: "0924-890-1234",
        address: "23 Camia Ave, Caloocan",
        joinedAt: new Date("2023-05-20"),
      },
    }),
    prisma.user.create({
      data: {
        name: "Ramon Aquino",
        email: "ramon.aquino@christfollowers.ph",
        passwordHash,
        role: "MEMBER",
        phone: "0925-901-2345",
        address: "67 Ilang-Ilang Rd, Valenzuela",
        joinedAt: new Date("2023-06-01"),
      },
    }),
    prisma.user.create({
      data: {
        name: "Sofia Bautista",
        email: "sofia.bautista@christfollowers.ph",
        passwordHash,
        role: "MEMBER",
        phone: "0926-012-3456",
        address: "90 Rosal St, Paranaque",
        joinedAt: new Date("2023-06-15"),
      },
    }),
    prisma.user.create({
      data: {
        name: "Roberto Cruz",
        email: "roberto.cruz@christfollowers.ph",
        passwordHash,
        role: "MEMBER",
        phone: "0927-123-4567",
        address: "45 Gumamela Blvd, Las Pinas",
        joinedAt: new Date("2023-07-01"),
      },
    }),
    prisma.user.create({
      data: {
        name: "Lourdes Reyes",
        email: "lourdes.reyes@christfollowers.ph",
        passwordHash,
        role: "MEMBER",
        phone: "0928-234-5678",
        address: "12 Santan Lane, Muntinlupa",
        joinedAt: new Date("2023-07-15"),
      },
    }),
    prisma.user.create({
      data: {
        name: "Miguel Torres",
        email: "miguel.torres@christfollowers.ph",
        passwordHash,
        role: "MEMBER",
        phone: "0929-345-6789",
        address: "78 Sunflower Ave, Pasay",
        joinedAt: new Date("2023-08-01"),
      },
    }),
    prisma.user.create({
      data: {
        name: "Consuelo Ramos",
        email: "consuelo.ramos@christfollowers.ph",
        passwordHash,
        role: "MEMBER",
        phone: "0930-456-7890",
        address: "34 Bougainvillea St, Quezon City",
        joinedAt: new Date("2023-08-15"),
      },
    }),
    prisma.user.create({
      data: {
        name: "Fernando Gonzales",
        email: "fernando.gonzales@christfollowers.ph",
        passwordHash,
        role: "MEMBER",
        phone: "0931-567-8901",
        address: "56 Hibiscus Rd, Malabon",
        joinedAt: new Date("2023-09-01"),
      },
    }),
  ]);

  const officers = [officer1, officer2];
  const allMembers = members;

  // Helper to pick a random recorder (officer or admin)
  function randomRecorder() {
    const recorders = [admin, ...officers];
    return recorders[Math.floor(Math.random() * recorders.length)];
  }

  // Helper to create a date in a specific month/year
  function monthDate(year: number, month: number, day: number) {
    return new Date(year, month - 1, day);
  }

  // Generate 6 months of deposits (Aug 2025 - Jan 2026)
  const depositMonths = [
    { year: 2025, month: 8 },
    { year: 2025, month: 9 },
    { year: 2025, month: 10 },
    { year: 2025, month: 11 },
    { year: 2025, month: 12 },
    { year: 2026, month: 1 },
  ];

  for (const { year, month } of depositMonths) {
    for (const member of allMembers) {
      // Each member deposits between 500 and 5000 PHP
      const amounts = [500, 750, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000];
      const amount = amounts[Math.floor(Math.random() * amounts.length)];
      const day = 1 + Math.floor(Math.random() * 25);

      await prisma.transaction.create({
        data: {
          userId: member.id,
          type: "DEPOSIT",
          amount,
          description: `Monthly contribution - ${month}/${year}`,
          recordedById: randomRecorder().id,
          createdAt: monthDate(year, month, day),
        },
      });
    }
  }

  // Some members have extra deposits
  const extraDepositors = [allMembers[0], allMembers[2], allMembers[5], allMembers[8]];
  for (const member of extraDepositors) {
    await prisma.transaction.create({
      data: {
        userId: member.id,
        type: "DEPOSIT",
        amount: 5000,
        description: "Special contribution - Christmas fund",
        recordedById: randomRecorder().id,
        createdAt: monthDate(2025, 12, 20),
      },
    });
  }

  // A few withdrawals
  await prisma.transaction.create({
    data: {
      userId: allMembers[3].id,
      type: "WITHDRAWAL",
      amount: 2000,
      description: "Emergency withdrawal",
      recordedById: officer1.id,
      createdAt: monthDate(2025, 11, 15),
    },
  });

  await prisma.transaction.create({
    data: {
      userId: allMembers[7].id,
      type: "WITHDRAWAL",
      amount: 1500,
      description: "Personal withdrawal",
      recordedById: officer2.id,
      createdAt: monthDate(2025, 12, 10),
    },
  });

  await prisma.transaction.create({
    data: {
      userId: allMembers[1].id,
      type: "WITHDRAWAL",
      amount: 3000,
      description: "Medical expenses",
      recordedById: officer1.id,
      createdAt: monthDate(2026, 1, 5),
    },
  });

  // Create Loans
  // Loan 1: Juan dela Cruz - Active loan
  const loan1 = await prisma.loan.create({
    data: {
      userId: allMembers[0].id,
      amount: 20000,
      interestRate: 12,
      termMonths: 6,
      monthlyPayment: 3556.67,
      totalDue: 21340.0,
      status: "ACTIVE",
      purpose: "Small business capital - sari-sari store",
      approvedById: admin.id,
      appliedAt: monthDate(2025, 9, 1),
      approvedAt: monthDate(2025, 9, 3),
      startDate: monthDate(2025, 9, 5),
    },
  });

  // Loan release transaction
  await prisma.transaction.create({
    data: {
      userId: allMembers[0].id,
      type: "LOAN_RELEASE",
      amount: 20000,
      description: "Loan disbursement - sari-sari store capital",
      loanId: loan1.id,
      recordedById: admin.id,
      createdAt: monthDate(2025, 9, 5),
    },
  });

  // 3 loan payments made
  for (let i = 0; i < 3; i++) {
    await prisma.transaction.create({
      data: {
        userId: allMembers[0].id,
        type: "LOAN_PAYMENT",
        amount: 3556.67,
        description: `Loan payment ${i + 1} of 6`,
        loanId: loan1.id,
        recordedById: randomRecorder().id,
        createdAt: monthDate(2025, 10 + i, 5),
      },
    });
  }

  // Loan 2: Carlos Mendoza - Active loan
  const loan2 = await prisma.loan.create({
    data: {
      userId: allMembers[2].id,
      amount: 15000,
      interestRate: 10,
      termMonths: 4,
      monthlyPayment: 3937.5,
      totalDue: 15750.0,
      status: "ACTIVE",
      purpose: "School tuition for children",
      approvedById: officer1.id,
      appliedAt: monthDate(2025, 10, 10),
      approvedAt: monthDate(2025, 10, 12),
      startDate: monthDate(2025, 10, 15),
    },
  });

  await prisma.transaction.create({
    data: {
      userId: allMembers[2].id,
      type: "LOAN_RELEASE",
      amount: 15000,
      description: "Loan disbursement - school tuition",
      loanId: loan2.id,
      recordedById: officer1.id,
      createdAt: monthDate(2025, 10, 15),
    },
  });

  // 2 payments made
  for (let i = 0; i < 2; i++) {
    await prisma.transaction.create({
      data: {
        userId: allMembers[2].id,
        type: "LOAN_PAYMENT",
        amount: 3937.5,
        description: `Loan payment ${i + 1} of 4`,
        loanId: loan2.id,
        recordedById: randomRecorder().id,
        createdAt: monthDate(2025, 11 + i, 15),
      },
    });
  }

  // Loan 3: Sofia Bautista - Paid loan
  const loan3 = await prisma.loan.create({
    data: {
      userId: allMembers[6].id,
      amount: 5000,
      interestRate: 8,
      termMonths: 2,
      monthlyPayment: 2566.67,
      totalDue: 5133.33,
      status: "PAID",
      purpose: "Medical expenses",
      approvedById: officer2.id,
      appliedAt: monthDate(2025, 8, 20),
      approvedAt: monthDate(2025, 8, 22),
      startDate: monthDate(2025, 9, 1),
    },
  });

  await prisma.transaction.create({
    data: {
      userId: allMembers[6].id,
      type: "LOAN_RELEASE",
      amount: 5000,
      description: "Loan disbursement - medical expenses",
      loanId: loan3.id,
      recordedById: officer2.id,
      createdAt: monthDate(2025, 9, 1),
    },
  });

  for (let i = 0; i < 2; i++) {
    await prisma.transaction.create({
      data: {
        userId: allMembers[6].id,
        type: "LOAN_PAYMENT",
        amount: 2566.67,
        description: `Loan payment ${i + 1} of 2`,
        loanId: loan3.id,
        recordedById: randomRecorder().id,
        createdAt: monthDate(2025, 10 + i, 1),
      },
    });
  }

  // Loan 4: Ramon Aquino - Pending loan
  await prisma.loan.create({
    data: {
      userId: allMembers[5].id,
      amount: 30000,
      interestRate: 12,
      termMonths: 12,
      monthlyPayment: 2800.0,
      totalDue: 33600.0,
      status: "PENDING",
      purpose: "Home renovation",
      appliedAt: monthDate(2026, 1, 20),
    },
  });

  // Loan 5: Elena Villanueva - Active loan
  const loan5 = await prisma.loan.create({
    data: {
      userId: allMembers[4].id,
      amount: 10000,
      interestRate: 10,
      termMonths: 5,
      monthlyPayment: 2166.67,
      totalDue: 10833.33,
      status: "ACTIVE",
      purpose: "Livelihood - buy and sell business",
      approvedById: admin.id,
      appliedAt: monthDate(2025, 11, 1),
      approvedAt: monthDate(2025, 11, 3),
      startDate: monthDate(2025, 11, 5),
    },
  });

  await prisma.transaction.create({
    data: {
      userId: allMembers[4].id,
      type: "LOAN_RELEASE",
      amount: 10000,
      description: "Loan disbursement - buy and sell business",
      loanId: loan5.id,
      recordedById: admin.id,
      createdAt: monthDate(2025, 11, 5),
    },
  });

  // 1 payment
  await prisma.transaction.create({
    data: {
      userId: allMembers[4].id,
      type: "LOAN_PAYMENT",
      amount: 2166.67,
      description: "Loan payment 1 of 5",
      loanId: loan5.id,
      recordedById: officer1.id,
      createdAt: monthDate(2025, 12, 5),
    },
  });

  console.log("Seed data created successfully!");
  console.log(`  - 1 admin, 2 officers, ${allMembers.length} members`);
  console.log("  - Default loan settings configured");
  console.log("  - 6 months of deposit transactions");
  console.log("  - 5 loans (2 active, 1 paid, 1 pending, 1 active)");
  console.log("");
  console.log("Demo login credentials (password: password123):");
  console.log("  Admin:   admin@christfollowers.ph");
  console.log("  Officer: maria.santos@christfollowers.ph");
  console.log("  Member:  juan.delacruz@christfollowers.ph");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
