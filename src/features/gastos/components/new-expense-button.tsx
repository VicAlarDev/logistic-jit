'use client';

import { useState } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  ExpenseFormDialog,
  type Expense
} from '@/components/expense-form-dialog';
import { useRouter } from 'next/navigation';

export function NewExpenseButton() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const handleFormSubmitSuccess = (expense: Expense) => {
    // Cerrar el diálogo
    setDialogOpen(false);
    // Refrescar la página para mostrar el nuevo gasto
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setDialogOpen(true)} size='sm'>
        <IconPlus className='mr-2 h-4 w-4' /> Crear nuevo gasto
      </Button>

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentExpense={null}
        onSubmitSuccess={handleFormSubmitSuccess}
      />
    </>
  );
}
