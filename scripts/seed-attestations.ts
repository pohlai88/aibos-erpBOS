import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and } from 'drizzle-orm';
import {
  attestProgram,
  attestTemplate,
  attestAssignment,
  appUser,
  company,
} from '@aibos/db-adapter/schema';

export async function seedAttestationsData() {
  console.log('🌱 Seeding M26.7 Attestations Portal data...');

  try {
    // Get demo company and admin user
    const [demoCompany] = await db
      .select()
      .from(company)
      .where(eq(company.code, 'DEMO'))
      .limit(1);

    if (!demoCompany) {
      console.log('❌ Demo company not found. Skipping attestations seed.');
      return;
    }

    const [adminUser] = await db
      .select()
      .from(appUser)
      .where(eq(appUser.email, 'admin@demo.com'))
      .limit(1);

    if (!adminUser) {
      console.log('❌ Admin user not found. Skipping attestations seed.');
      return;
    }

    // 1. Create SOX 302 Quarterly Program
    const programId = ulid();
    const programData = {
      id: programId,
      companyId: demoCompany.id,
      code: '302-QUARTERLY',
      name: 'SOX 302 Sub-Certification',
      freq: 'QUARTERLY',
      scope: [
        'PROCESS:R2R',
        'PROCESS:P2P',
        'PROCESS:O2C',
        'PROCESS:Treasury',
        'PROCESS:Tax',
      ],
      active: true,
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
    };

    await db.insert(attestProgram).values(programData).onConflictDoNothing();

    console.log('✅ Created SOX 302 Quarterly Program');

    // 2. Create SOX 404 Annual Program
    const program404Id = ulid();
    const program404Data = {
      id: program404Id,
      companyId: demoCompany.id,
      code: '404-ANNUAL',
      name: 'SOX 404 Management Assessment',
      freq: 'ANNUAL',
      scope: [
        'PROCESS:R2R',
        'PROCESS:P2P',
        'PROCESS:O2C',
        'PROCESS:Treasury',
        'PROCESS:Tax',
        'ENTITY:MY',
      ],
      active: true,
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
    };

    await db.insert(attestProgram).values(program404Data).onConflictDoNothing();

    console.log('✅ Created SOX 404 Annual Program');

    // 3. Create SOX 302 Template v1
    const template302Id = ulid();
    const template302Data = {
      id: template302Id,
      companyId: demoCompany.id,
      code: '302-v1',
      title: 'SOX 302 Quarterly Sub-Certification',
      version: 1,
      schema: {
        version: 1,
        questions: [
          {
            id: 'q1',
            label:
              'Have there been any material changes to internal controls over financial reporting?',
            type: 'YN',
            requireEvidence: false,
            required: true,
          },
          {
            id: 'q2',
            label: 'Are there any material weaknesses in internal controls?',
            type: 'YN',
            requireEvidence: true,
            required: true,
          },
          {
            id: 'q3',
            label: 'Have all significant deficiencies been properly disclosed?',
            type: 'YN',
            requireEvidence: true,
            required: true,
          },
          {
            id: 'q4',
            label:
              'Describe any exceptions to standard policies and procedures:',
            type: 'TEXT',
            requireEvidence: false,
            required: false,
          },
          {
            id: 'q5',
            label: 'Attach evidence of JE continuity and reconciliation:',
            type: 'EVIDENCE',
            requireEvidence: true,
            required: true,
          },
          {
            id: 'q6',
            label: 'Attach evidence of account reconciliation completeness:',
            type: 'EVIDENCE',
            requireEvidence: true,
            required: true,
          },
        ],
      },
      requiresEvidence: true,
      status: 'ACTIVE',
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
    };

    await db
      .insert(attestTemplate)
      .values(template302Data)
      .onConflictDoNothing();

    console.log('✅ Created SOX 302 Template v1');

    // 4. Create SOX 404 Template v1
    const template404Id = ulid();
    const template404Data = {
      id: template404Id,
      companyId: demoCompany.id,
      code: '404-v1',
      title: 'SOX 404 Annual Management Assessment',
      version: 1,
      schema: {
        version: 1,
        questions: [
          {
            id: 'q1',
            label:
              'Management has evaluated the effectiveness of internal controls over financial reporting as of year-end:',
            type: 'YN',
            requireEvidence: true,
            required: true,
          },
          {
            id: 'q2',
            label:
              'Management has identified and documented all significant processes and controls:',
            type: 'YN',
            requireEvidence: true,
            required: true,
          },
          {
            id: 'q3',
            label:
              'Management has tested the operating effectiveness of key controls:',
            type: 'YN',
            requireEvidence: true,
            required: true,
          },
          {
            id: 'q4',
            label:
              'Management has remediated all material weaknesses identified:',
            type: 'YN',
            requireEvidence: true,
            required: true,
          },
          {
            id: 'q5',
            label:
              'Management has provided adequate disclosure of control deficiencies:',
            type: 'YN',
            requireEvidence: true,
            required: true,
          },
          {
            id: 'q6',
            label: 'Attach Management Assessment Report:',
            type: 'EVIDENCE',
            requireEvidence: true,
            required: true,
          },
          {
            id: 'q7',
            label: 'Attach Control Testing Results:',
            type: 'EVIDENCE',
            requireEvidence: true,
            required: true,
          },
          {
            id: 'q8',
            label: 'Attach Deficiency Remediation Plan:',
            type: 'EVIDENCE',
            requireEvidence: true,
            required: true,
          },
        ],
      },
      requiresEvidence: true,
      status: 'ACTIVE',
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
    };

    await db
      .insert(attestTemplate)
      .values(template404Data)
      .onConflictDoNothing();

    console.log('✅ Created SOX 404 Template v1');

    // 5. Create sample assignments for R2R process
    const r2rAssignmentId = ulid();
    const r2rAssignmentData = {
      id: r2rAssignmentId,
      companyId: demoCompany.id,
      programId: programId,
      scopeKey: 'PROCESS:R2R',
      assigneeId: adminUser.id,
      approverId: adminUser.id, // Self-approval for demo
      createdBy: adminUser.id,
    };

    await db
      .insert(attestAssignment)
      .values(r2rAssignmentData)
      .onConflictDoNothing();

    console.log('✅ Created R2R Process Assignment');

    // 6. Create sample assignments for P2P process
    const p2pAssignmentId = ulid();
    const p2pAssignmentData = {
      id: p2pAssignmentId,
      companyId: demoCompany.id,
      programId: programId,
      scopeKey: 'PROCESS:P2P',
      assigneeId: adminUser.id,
      approverId: adminUser.id,
      createdBy: adminUser.id,
    };

    await db
      .insert(attestAssignment)
      .values(p2pAssignmentData)
      .onConflictDoNothing();

    console.log('✅ Created P2P Process Assignment');

    // 7. Create sample assignments for O2C process
    const o2cAssignmentId = ulid();
    const o2cAssignmentData = {
      id: o2cAssignmentId,
      companyId: demoCompany.id,
      programId: programId,
      scopeKey: 'PROCESS:O2C',
      assigneeId: adminUser.id,
      approverId: adminUser.id,
      createdBy: adminUser.id,
    };

    await db
      .insert(attestAssignment)
      .values(o2cAssignmentData)
      .onConflictDoNothing();

    console.log('✅ Created O2C Process Assignment');

    // 8. Create sample assignments for SOX 404
    const sox404AssignmentId = ulid();
    const sox404AssignmentData = {
      id: sox404AssignmentId,
      companyId: demoCompany.id,
      programId: program404Id,
      scopeKey: 'ENTITY:MY',
      assigneeId: adminUser.id,
      approverId: adminUser.id,
      createdBy: adminUser.id,
    };

    await db
      .insert(attestAssignment)
      .values(sox404AssignmentData)
      .onConflictDoNothing();

    console.log('✅ Created SOX 404 Entity Assignment');

    console.log(
      '🎉 M26.7 Attestations Portal seed data completed successfully!'
    );
    console.log('');
    console.log('📋 Created Programs:');
    console.log('  - SOX 302 Quarterly Sub-Certification');
    console.log('  - SOX 404 Annual Management Assessment');
    console.log('');
    console.log('📝 Created Templates:');
    console.log('  - SOX 302 Template v1 (6 questions)');
    console.log('  - SOX 404 Template v1 (8 questions)');
    console.log('');
    console.log('👥 Created Assignments:');
    console.log('  - R2R Process (admin@demo.com)');
    console.log('  - P2P Process (admin@demo.com)');
    console.log('  - O2C Process (admin@demo.com)');
    console.log('  - SOX 404 Entity (admin@demo.com)');
    console.log('');
    console.log('🚀 Ready to issue campaigns and start attestations!');
  } catch (error) {
    console.error('❌ Failed to seed attestations data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedAttestationsData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
