import { prisma } from '../config/prisma';

// Infrastructure Services
import { BcryptCryptoService } from '../infrastructure/crypto/BcryptCryptoService';
import { JwtTokenService } from '../infrastructure/crypto/JwtTokenService';
import { RedisLockService } from '../infrastructure/cache/RedisLockService';
import { PdfKitInvoiceService } from '../infrastructure/pdf/PdfKitInvoiceService';
import { PdfKitAgreementService } from '../infrastructure/pdf/PdfKitAgreementService';
import { MockOtpService } from '../infrastructure/otp/MockOtpService';

// Document System
import { DocumentRepository } from '../modules/documents/documents.repository';
import { DocumentService } from '../modules/documents/documents.service';
import { DocumentController } from '../modules/documents/documents.controller';
import { DocumentStorageService } from '../services/documents/DocumentStorageService';

// Modular Feature Repositories, Services, and Controllers
import { AuthRepository, AuthService, AuthController } from '../modules/auth';
import { PropertyRepository, PropertyService, PropertyController } from '../modules/properties';
import { ResidentRepository, ResidentService, ResidentController } from '../modules/residents';
import { BillingRepository, BillingService, BillingController } from '../modules/billing';
import { ComplaintRepository, ComplaintService, ComplaintController } from '../modules/complaints';
import { AgreementRepository, AgreementService, AgreementController } from '../modules/agreements';
import { ResidentManagementRepository } from '../repositories/ResidentManagementRepository';
import { ResidentManagementService } from '../services/ResidentManagementService';
import { ResidentManagementController } from '../controllers/residentManagementController';

import { PaymentStrategyContext } from '../core/patterns/payment/PaymentStrategy';
import { EventDispatcher } from '../core/patterns/events/EventDispatcher';

export class Container {
  private static _paymentStrategyContext?: PaymentStrategyContext;
  private static _eventDispatcher?: EventDispatcher;

  private static _cryptoService?: BcryptCryptoService;
  private static _tokenService?: JwtTokenService;
  private static _lockService?: RedisLockService;
  private static _pdfInvoiceService?: PdfKitInvoiceService;
  private static _pdfAgreementService?: PdfKitAgreementService;
  private static _otpService?: MockOtpService;

  private static _userRepository?: AuthRepository;
  private static _propertyRepository?: PropertyRepository;
  private static _residentRepository?: ResidentRepository;
  private static _billingRepository?: BillingRepository;
  private static _complaintRepository?: ComplaintRepository;
  private static _agreementRepository?: AgreementRepository;
  private static _residentManagementRepository?: ResidentManagementRepository;

  private static _authService?: AuthService;
  private static _propertyService?: PropertyService;
  private static _residentService?: ResidentService;
  private static _billingService?: BillingService;
  private static _complaintService?: ComplaintService;
  private static _agreementService?: AgreementService;
  private static _residentManagementService?: ResidentManagementService;

  // Document system
  private static _documentRepository?: DocumentRepository;
  private static _documentStorageService?: DocumentStorageService;
  private static _documentService?: DocumentService;
  private static _documentController?: DocumentController;

  private static _authController?: AuthController;
  private static _propertyController?: PropertyController;
  private static _residentController?: ResidentController;
  private static _billingController?: BillingController;
  private static _complaintController?: ComplaintController;
  private static _agreementController?: AgreementController;
  private static _residentManagementController?: ResidentManagementController;

  // Database Client
  public static get db() {
    return prisma;
  }

  // Pattern Services & Enterprise Architecture Contexts
  public static get paymentStrategyContext() {
    if (!this._paymentStrategyContext) {
      this._paymentStrategyContext = new PaymentStrategyContext();
    }
    return this._paymentStrategyContext;
  }

  public static get eventDispatcher() {
    if (!this._eventDispatcher) {
      this._eventDispatcher = EventDispatcher.getInstance();
    }
    return this._eventDispatcher;
  }

  // Infrastructure Services
  public static get cryptoService() {
    if (!this._cryptoService) {
      this._cryptoService = new BcryptCryptoService();
    }
    return this._cryptoService;
  }

  public static get tokenService() {
    if (!this._tokenService) {
      this._tokenService = new JwtTokenService();
    }
    return this._tokenService;
  }

  public static get lockService() {
    if (!this._lockService) {
      this._lockService = new RedisLockService();
    }
    return this._lockService;
  }

  public static get pdfInvoiceService() {
    if (!this._pdfInvoiceService) {
      this._pdfInvoiceService = new PdfKitInvoiceService();
    }
    return this._pdfInvoiceService;
  }

  public static get pdfAgreementService() {
    if (!this._pdfAgreementService) {
      this._pdfAgreementService = new PdfKitAgreementService();
    }
    return this._pdfAgreementService;
  }

  public static get otpService() {
    if (!this._otpService) {
      this._otpService = new MockOtpService();
    }
    return this._otpService;
  }

  // Feature Repositories
  public static get userRepository() {
    if (!this._userRepository) {
      this._userRepository = new AuthRepository(Container.db);
    }
    return this._userRepository;
  }

  public static get propertyRepository() {
    if (!this._propertyRepository) {
      this._propertyRepository = new PropertyRepository(Container.db);
    }
    return this._propertyRepository;
  }

  public static get residentRepository() {
    if (!this._residentRepository) {
      this._residentRepository = new ResidentRepository(Container.db);
    }
    return this._residentRepository;
  }

  public static get billingRepository() {
    if (!this._billingRepository) {
      this._billingRepository = new BillingRepository(Container.db);
    }
    return this._billingRepository;
  }

  public static get complaintRepository() {
    if (!this._complaintRepository) {
      this._complaintRepository = new ComplaintRepository(Container.db);
    }
    return this._complaintRepository;
  }

  public static get agreementRepository() {
    if (!this._agreementRepository) {
      this._agreementRepository = new AgreementRepository(Container.db);
    }
    return this._agreementRepository;
  }

  public static get residentManagementRepository() {
    if (!this._residentManagementRepository) {
      this._residentManagementRepository = new ResidentManagementRepository(Container.db);
    }
    return this._residentManagementRepository;
  }

  public static get documentRepository() {
    if (!this._documentRepository) {
      this._documentRepository = new DocumentRepository(Container.db);
    }
    return this._documentRepository;
  }

  public static get documentStorageService() {
    if (!this._documentStorageService) {
      this._documentStorageService = new DocumentStorageService();
    }
    return this._documentStorageService;
  }

  // Domain Services
  public static get authService() {
    if (!this._authService) {
      this._authService = new AuthService(
        Container.userRepository,
        Container.cryptoService,
        Container.tokenService,
        Container.otpService
      );
    }
    return this._authService;
  }

  public static get propertyService() {
    if (!this._propertyService) {
      this._propertyService = new PropertyService(Container.propertyRepository);
    }
    return this._propertyService;
  }

  public static get residentService() {
    if (!this._residentService) {
      this._residentService = new ResidentService(
        Container.residentRepository,
        Container.userRepository,
        Container.cryptoService
      );
    }
    return this._residentService;
  }

  public static get billingService() {
    if (!this._billingService) {
      this._billingService = new BillingService(
        Container.billingRepository,
        Container.residentRepository,
        Container.lockService,
        Container.pdfInvoiceService
      );
    }
    return this._billingService;
  }

  public static get complaintService() {
    if (!this._complaintService) {
      this._complaintService = new ComplaintService(
        Container.complaintRepository,
        Container.residentRepository
      );
    }
    return this._complaintService;
  }

  public static get agreementService() {
    if (!this._agreementService) {
      this._agreementService = new AgreementService(
        Container.agreementRepository,
        Container.pdfAgreementService
      );
    }
    return this._agreementService;
  }

  public static get residentManagementService() {
    if (!this._residentManagementService) {
      this._residentManagementService = new ResidentManagementService(
        Container.residentManagementRepository
      );
    }
    return this._residentManagementService;
  }

  public static get documentService() {
    if (!this._documentService) {
      this._documentService = new DocumentService(
        Container.documentRepository,
        Container.documentStorageService,
        Container.db
      );
    }
    return this._documentService;
  }

  // Feature Controllers
  public static get authController() {
    if (!this._authController) {
      this._authController = new AuthController(Container.authService);
    }
    return this._authController;
  }

  public static get propertyController() {
    if (!this._propertyController) {
      this._propertyController = new PropertyController(Container.propertyService);
    }
    return this._propertyController;
  }

  public static get residentController() {
    if (!this._residentController) {
      this._residentController = new ResidentController(Container.residentService);
    }
    return this._residentController;
  }

  public static get billingController() {
    if (!this._billingController) {
      this._billingController = new BillingController(Container.billingService);
    }
    return this._billingController;
  }

  public static get complaintController() {
    if (!this._complaintController) {
      this._complaintController = new ComplaintController(Container.complaintService);
    }
    return this._complaintController;
  }

  public static get agreementController() {
    if (!this._agreementController) {
      this._agreementController = new AgreementController(Container.agreementService);
    }
    return this._agreementController;
  }

  public static get residentManagementController() {
    if (!this._residentManagementController) {
      this._residentManagementController = new ResidentManagementController(
        Container.residentManagementService
      );
    }
    return this._residentManagementController;
  }

  public static get documentController() {
    if (!this._documentController) {
      this._documentController = new DocumentController(Container.documentService);
    }
    return this._documentController;
  }
}
