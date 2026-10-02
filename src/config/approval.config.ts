export interface ApprovalStep {
  step: number;
  role: string;
  title: string;
  delegate?: string; // Optional delegate username or role placeholder
}

/**
 * Returns ordered approval steps based on transaction amount and category
 */
export function getApprovalSteps(amount: number, category?: string): ApprovalStep[] {
  if (amount < 1000) {
    return [
      {
        step: 1,
        role: 'WAREHOUSE_SUPERVISOR',
        title: 'Warehouse Supervisor',
        delegate: 'INVENTORY_MANAGER'
      }
    ];
  }

  if (amount < 20000) {
    return [
      {
        step: 1,
        role: 'WAREHOUSE_SUPERVISOR',
        title: 'Warehouse Supervisor',
        delegate: 'INVENTORY_MANAGER'
      },
      {
        step: 2,
        role: 'DEPARTMENT_HEAD',
        title: 'Department Head',
        delegate: 'ACADEMIC_COORDINATOR'
      }
    ];
  }

  // amount >= 20,000
  return [
    {
      step: 1,
      role: 'WAREHOUSE_SUPERVISOR',
      title: 'Warehouse Supervisor',
      delegate: 'INVENTORY_MANAGER'
    },
    {
      step: 2,
      role: 'DIRECTOR',
      title: 'School Director / Head of School',
      delegate: 'DEPUTY_DIRECTOR'
    }
  ];
}
