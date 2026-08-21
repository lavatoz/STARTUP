const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const newDefinitions = `
enum OrganizationRole {
  OWNER
  ADMIN
  MANAGER
  STAFF
  ACCOUNTANT
  CLIENT
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  GRACE_PERIOD
  SUSPENDED
  CANCELLED
  EXPIRED
}

enum PlatformRole {
  SUPER_ADMIN
  PLATFORM_ADMIN
  SUPPORT
  USER
}

model Organization {
  id                  String               @id @default(uuid())
  name                String
  slug                String               @unique
  logoUrl             String?
  faviconUrl          String?
  primaryColor        String               @default("#F7F5F0")
  secondaryColor      String               @default("#77736B")
  accentColor         String               @default("#B89452")
  themePreset         String               @default("light")
  coverImageUrl       String?
  businessDesc        String?
  contactEmail        String?
  phone               String?
  whatsapp            String?
  address             String?
  website             String?
  socialLinks         Json?
  currency            String               @default("USD")
  timezone            String               @default("UTC")
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
  deletedAt           DateTime?

  members             OrganizationMember[]
  subscriptions       Subscription[]
  saasPayments        SaasPayment[]
  documentCounters    DocumentCounter[]
  
  clients             Client[]
  projects            Project[]
  events              Event[]
  tasks               Task[]
  invoices            Invoice[]
  quotations          Quotation[]
  agreements          Agreement[]
  payments            Payment[]
  files               File[]
  workflowEvents      WorkflowEvent[]
  notifications       Notification[]
  auditLogs           AuditLog[]
  securityEvents      SecurityEvent[]
  companyProfiles     CompanyProfile[]
  expenses            Expense[]
  approvals           Approval[]
  personnel           Personnel[]
  agreementTemplates  AgreementTemplate[]
  standaloneAgreementTemplates StandaloneAgreementTemplate[]
  standaloneAgreements StandaloneAgreement[]
  websiteGalleries    WebsiteGallery[]
  divisions           Division[]
  documentRegistries  DocumentRegistry[]
  galleryCollections  GalleryCollection[]
}

model OrganizationMember {
  id              String           @id @default(uuid())
  organizationId  String
  userId          String
  role            OrganizationRole
  joinedAt        DateTime         @default(now())
  status          String           @default("Active")
  
  organization    Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessions        UserSession[]
  refreshTokens   RefreshToken[]

  @@unique([organizationId, userId])
}

model Plan {
  id            String         @id @default(uuid())
  name          String         @unique
  description   String?
  price         Decimal        @db.Decimal(12, 2)
  interval      String         @default("month")
  features      Json
  limits        Json
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  subscriptions Subscription[]
}

model Subscription {
  id                     String             @id @default(uuid())
  organizationId         String
  planId                 String
  status                 SubscriptionStatus @default(TRIAL)
  startDate              DateTime           @default(now())
  endDate                DateTime?
  cancelAtPeriodEnd      Boolean            @default(false)
  currentPeriodStart     DateTime           @default(now())
  currentPeriodEnd       DateTime
  paymentMethod          String?
  providerCustomerId     String?
  providerSubscriptionId String?
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt
  
  organization           Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  plan                   Plan               @relation(fields: [planId], references: [id])
  saasPayments           SaasPayment[]
}

model SaasPayment {
  id                 String       @id @default(uuid())
  organizationId     String
  subscriptionId     String?
  amount             Decimal      @db.Decimal(12, 2)
  currency           String       @default("USD")
  status             String
  providerPaymentId  String?
  providerInvoiceId  String?
  paymentMethod      String?
  paidAt             DateTime?
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt
  
  organization       Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  subscription       Subscription? @relation(fields: [subscriptionId], references: [id])
}
`;

// 2. Modify User Model
schema = schema.replace(
  'model User {',
  'model User {\n  platformRole        PlatformRole      @default(USER)\n  organizationMembers OrganizationMember[]'
);

// 3. Modify RefreshToken Model
schema = schema.replace(
  'model RefreshToken {',
  'model RefreshToken {\n  membershipId    String?\n  membership      OrganizationMember? @relation(fields: [membershipId], references: [id], onDelete: Cascade)'
);

// 4. Modify UserSession Model
schema = schema.replace(
  'model UserSession {',
  'model UserSession {\n  membershipId   String?\n  membership     OrganizationMember? @relation(fields: [membershipId], references: [id], onDelete: Cascade)'
);

// 5. Replace DocumentCounter Model entirely
schema = schema.replace(
  /model DocumentCounter \{([\s\S]*?)\}/,
  `model DocumentCounter {
  organizationId String
  prefix         String
  type           String
  year           Int
  lastValue      Int    @default(0)
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@id([organizationId, prefix, type, year])
}`
);

// 6. Target models that receive organizationId
const targetModels = [
  'Client',
  'Project',
  'Event',
  'Task',
  'Invoice',
  'Quotation',
  'Agreement',
  'Payment',
  'File',
  'WorkflowEvent',
  'Notification',
  'AuditLog',
  'SecurityEvent',
  'CompanyProfile',
  'Expense',
  'Approval',
  'Personnel',
  'AgreementTemplate',
  'StandaloneAgreementTemplate',
  'StandaloneAgreement',
  'WebsiteGallery',
  'Division',
  'DocumentRegistry',
  'GalleryCollection'
];

for (const modelName of targetModels) {
  const modelRegex = new RegExp("model " + modelName + " \\{([\\s\\S]*?)\\}", "g");
  schema = schema.replace(modelRegex, (match, body) => {
    if (body.includes('organizationId')) {
      return match;
    }
    
    let newBody = `\n  organizationId String\n  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)\n` + body;
    
    if (!newBody.includes('@@index([organizationId])')) {
      newBody += `\n  @@index([organizationId])`;
    }
    
    return `model ${modelName} {${newBody}\n}`;
  });
}

// Append new definitions
schema = schema.trim() + '\n' + newDefinitions;

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('Successfully refactored schema.prisma for multi-tenancy!');
