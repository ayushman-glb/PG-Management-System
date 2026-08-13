import { prisma } from '../config/prisma';

// Infrastructure Services
import { BcryptCryptoService } from '../infrastructure/crypto/BcryptCryptoService';
import { JwtTokenService } from '../infrastructure/crypto/JwtTokenService';
import { RedisLockService } from '../infrastructure/cache/RedisLockService';
import { PdfKitInvoiceService } from '../infrastructure/pdf/PdfKitInvoiceService';
import { PdfKitAgreementService } from '../infrastructure/pdf/PdfKitAgreementService';
import { RedisOtpService } from '../infrastructure/otp/RedisOtpService';
import { TotpService } from '../infrastructure/crypto/TotpService';

// Document System
import { DocumentRepository } from '../modules/documents/documents.repository';
import { DocumentService } from '../modules/documents/documents.service';
import { DocumentController } from '../modules/documents/documents.controller';
import { DocumentStorageService } from '../services/documents/DocumentStorageService';

// Modular Feature Repositories, Services, and Controllers
import { AuthRepository } from '../modules/auth/auth.repository';
import { AuthService } from '../modules/auth/auth.service';
import { AuthController } from '../modules/auth/auth.controller';
import { PropertyRepository } from '../modules/properties/property.repository';
import { PropertyService } from '../modules/properties/property.service';
import { PropertyController } from '../modules/properties/property.controller';
import { ResidentRepository } from '../modules/residents/resident.repository';
import { ResidentService } from '../modules/residents/resident.service';
import { ResidentController } from '../modules/residents/resident.controller';
import { BillingRepository } from '../modules/billing/billing.repository';
import { BillingService } from '../modules/billing/billing.service';
import { BillingController } from '../modules/billing/billing.controller';
import { ComplaintRepository } from '../modules/complaints/complaint.repository';
import { ComplaintService } from '../modules/complaints/complaint.service';
import { ComplaintController } from '../modules/complaints/complaint.controller';
import { AgreementRepository } from '../modules/agreements/agreement.repository';
import { AgreementService } from '../modules/agreements/agreement.service';
import { AgreementController } from '../modules/agreements/agreement.controller';
import { ResidentManagementRepository } from '../repositories/ResidentManagementRepository';
import { ResidentManagementService } from '../services/ResidentManagementService';
import { ResidentManagementController } from '../controllers/residentManagementController';

// Device Security Subsystem
import { DeviceRepository } from '../modules/devices/device.repository';
import { DeviceService } from '../modules/devices/device.service';
import { DeviceController } from '../modules/devices/device.controller';

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
  private static _otpService?: RedisOtpService;

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
    return (global as any).prismaSingleton || prisma;
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
      this._otpService = new RedisOtpService();
    }
    return this._otpService;
  }

  // Feature Repositories
  public static set userRepository(repo: any) {
    this._userRepository = repo;
  }

  public static set authService(service: any) {
    this._authService = service;
  }

  public static set authController(controller: any) {
    this._authController = controller;
  }

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
      try {
        this._authService = new AuthService(
          Container.userRepository,
          Container.cryptoService,
          Container.tokenService,
          Container.otpService
        );
      } catch (err: any) {
        process.stderr.write(`\n\n>>> ERROR CREATING AUTH SERVICE: ${err?.message}\n${err?.stack}\n\n`);
      }
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

  // Device Security Subsystem
  private static _deviceRepository?: DeviceRepository;
  private static _deviceService?: DeviceService;
  private static _deviceController?: DeviceController;

  public static get deviceRepository() {
    if (!this._deviceRepository) {
      this._deviceRepository = new DeviceRepository(Container.db);
    }
    return this._deviceRepository;
  }

  public static get deviceService() {
    if (!this._deviceService) {
      this._deviceService = new DeviceService(Container.deviceRepository);
    }
    return this._deviceService;
  }

  public static get deviceController() {
    if (!this._deviceController) {
      this._deviceController = new DeviceController(Container.deviceService);
    }
    return this._deviceController;
  }
}
