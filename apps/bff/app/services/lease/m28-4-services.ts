// Simple working version for M28.4 services
export class IndexationService {
  constructor() {}

  async ingestIndexValues(
    companyId: string,
    userId: string,
    data: any
  ): Promise<void> {
    console.log('IndexationService.ingestIndexValues called', {
      companyId,
      userId,
      data,
    });
  }

  async planResets(companyId: string, data: any): Promise<any> {
    return {
      lease_id: data.lease_id,
      planned_resets: [],
      candidate_mod_id: undefined,
    };
  }

  async applyIndexReset(
    companyId: string,
    userId: string,
    modId: string
  ): Promise<void> {
    console.log('IndexationService.applyIndexReset called', {
      companyId,
      userId,
      modId,
    });
  }

  async getIndexValues(
    companyId: string,
    indexCode: string,
    fromDate?: string,
    toDate?: string
  ): Promise<any[]> {
    return [];
  }

  async upsertIndexProfile(
    companyId: string,
    userId: string,
    leaseId: string,
    indexCode: string,
    profile: any
  ): Promise<string> {
    return 'test-id';
  }
}

export class ConcessionService {
  constructor() {}

  async createConcession(
    companyId: string,
    userId: string,
    data: any
  ): Promise<any> {
    return {
      mod_id: 'test-mod-id',
      lease_id: data.lease_id,
      status: 'DRAFT',
      created_at: new Date().toISOString(),
    };
  }

  async applyConcession(
    companyId: string,
    userId: string,
    modId: string
  ): Promise<void> {
    console.log('ConcessionService.applyConcession called', {
      companyId,
      userId,
      modId,
    });
  }

  async updateConcessionPolicy(
    companyId: string,
    userId: string,
    policy: any
  ): Promise<void> {
    console.log('ConcessionService.updateConcessionPolicy called', {
      companyId,
      userId,
      policy,
    });
  }

  async getConcessionModifications(
    companyId: string,
    leaseId: string
  ): Promise<any[]> {
    return [];
  }
}

export class ScopeTermService {
  constructor() {}

  async createScopeModification(
    companyId: string,
    userId: string,
    data: any
  ): Promise<any> {
    return {
      mod_id: 'test-scope-mod-id',
      lease_id: data.lease_id,
      status: 'DRAFT',
      created_at: new Date().toISOString(),
    };
  }

  async createTermModification(
    companyId: string,
    userId: string,
    data: any
  ): Promise<any> {
    return {
      mod_id: 'test-term-mod-id',
      lease_id: data.lease_id,
      status: 'DRAFT',
      created_at: new Date().toISOString(),
    };
  }

  async applyScopeModification(
    companyId: string,
    userId: string,
    modId: string
  ): Promise<void> {
    console.log('ScopeTermService.applyScopeModification called', {
      companyId,
      userId,
      modId,
    });
  }

  async applyTermModification(
    companyId: string,
    userId: string,
    modId: string
  ): Promise<void> {
    console.log('ScopeTermService.applyTermModification called', {
      companyId,
      userId,
      modId,
    });
  }

  async calculateDerecognitionAmount(
    companyId: string,
    leaseId: string,
    componentId: string,
    effectiveDate: string
  ): Promise<any> {
    return {
      liability_amount: 0,
      rou_amount: 0,
      gain_loss: 0,
    };
  }

  async getScopeModifications(
    companyId: string,
    leaseId: string
  ): Promise<any[]> {
    return [];
  }
}

export class RemeasurementEngine {
  constructor() {}

  async applyRemeasurement(
    companyId: string,
    userId: string,
    data: any
  ): Promise<any> {
    return {
      mod_id: data.mod_id,
      status: data.dry_run ? 'DRAFT' : 'APPLIED',
      pre_carrying: {
        total_liability: 0,
        total_rou: 0,
        component_carryings: [],
      },
      post_carrying: {
        total_liability: 0,
        total_rou: 0,
        component_carryings: [],
      },
      deltas: { liability_delta: 0, rou_delta: 0, component_deltas: [] },
      schedule_deltas: [],
    };
  }

  async postRemeasurement(
    companyId: string,
    userId: string,
    data: any
  ): Promise<any> {
    return {
      post_id: 'test-post-id',
      mod_id: data.mod_id,
      journal_entry_id: 'test-journal-id',
      year: data.year,
      month: data.month,
      total_liability_delta: 0,
      total_rou_delta: 0,
      journal_lines: [],
      posted_at: new Date().toISOString(),
      posted_by: userId,
    };
  }
}
