'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableFooter,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

import { createClient } from '@/lib/supabase/client';
import { Expense, ExpenseFormDialog } from '@/components/expense-form-dialog';

const supabase = createClient();

interface ExpensesManagerProps {
  fleteId?: string;
}

export default function ExpensesManager({ fleteId }: ExpensesManagerProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  // Fetch gastos (por flete o generales)
  useEffect(() => {
    const fetchExpenses = async () => {
      setIsLoading(true);

      // Si fleteId es undefined o null, no traemos nada
      if (!fleteId) {
        setExpenses([]);
        setIsLoading(false);
        return;
      }

      // Sólo traemos los gastos del flete
      const { data, error } = await supabase
        .from('gastos')
        .select('*')
        .eq('flete_id', fleteId)
        .order('expense_date', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        toast.error('Error al cargar gastos');
      } else {
        setExpenses(data as Expense[]);
      }
      setIsLoading(false);
    };

    fetchExpenses();
  }, [fleteId]);

  const handleEdit = (expense: Expense) => {
    setCurrentExpense(expense);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setCurrentExpense(null);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setExpenseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    const { error } = await supabase
      .from('gastos')
      .delete()
      .eq('id', expenseToDelete);
    if (error) {
      console.error('Error deleting expense:', error);
      toast.error('Error al eliminar el gasto');
    } else {
      setExpenses((prev) => prev.filter((e) => e.id !== expenseToDelete));
      toast.success('Gasto eliminado correctamente');
    }
    setDeleteDialogOpen(false);
    setExpenseToDelete(null);
  };

  const handleFormSubmitSuccess = (expense: Expense) => {
    if (currentExpense) {
      // Update existing expense
      setExpenses((prev) =>
        prev.map((e) => (e.id === expense.id ? expense : e))
      );
    } else {
      // Add new expense
      setExpenses((prev) => [expense, ...prev]);
    }
  };

  // Totales
  const totalDivisas = expenses.reduce((s, e) => s + (e.pago_divisa ?? 0), 0);
  const totalBolivares = expenses.reduce(
    (s, e) => s + (e.pago_bolivares ?? 0),
    0
  );

  const formatDate = (d: string) =>
    format(new Date(d), 'dd MMM yyyy', { locale: es });
  const fmtUSD = (a: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD'
    }).format(a);
  const fmtVES = (a: number) => {
    // formateamos con separadores de miles y dos decimales
    const formatted = new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(a);
    return `Bs. ${formatted}`;
  };

  return (
    <ScrollArea className='max-w-[95vw] space-y-4 md:max-w-full'>
      <div className='mb-4 flex justify-start'>
        <Button onClick={handleAdd}>
          <Plus className='mr-2 h-4 w-4' /> Agregar Gasto
        </Button>
      </div>

      <div className='rounded-lg border p-2'>
        {isLoading ? (
          <p className='py-4 text-center'>Cargando gastos...</p>
        ) : expenses.length > 0 ? (
          <div className='w-full overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Moneda Orig.</TableHead>
                  <TableHead className='text-right'>USD</TableHead>
                  <TableHead className='text-right'>VES</TableHead>
                  <TableHead className='text-right'>Tasa</TableHead>
                  <TableHead>Tipo Tasa</TableHead>
                  <TableHead className='text-right'>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell>{formatDate(exp.expense_date)}</TableCell>
                    <TableCell>{exp.category}</TableCell>
                    <TableCell>{exp.description ?? '—'}</TableCell>
                    <TableCell>{exp.original_currency}</TableCell>
                    <TableCell className='text-right'>
                      {exp.pago_divisa != null ? fmtUSD(exp.pago_divisa) : '—'}
                    </TableCell>
                    <TableCell className='text-right'>
                      {exp.pago_bolivares != null
                        ? fmtVES(exp.pago_bolivares)
                        : '—'}
                    </TableCell>
                    <TableCell className='text-right'>
                      {exp.tasa_cambio != null ? fmtVES(exp.tasa_cambio) : '—'}
                    </TableCell>
                    <TableCell>{exp.tipo_tasa ?? '—'}</TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleEdit(exp)}
                      >
                        <Pencil className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleDelete(exp.id)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className='text-right'>
                    <strong>Totales:</strong>
                  </TableCell>
                  <TableCell className='text-right'>
                    <strong>{fmtUSD(totalDivisas)}</strong>
                  </TableCell>
                  <TableCell className='text-right'>
                    <strong>{fmtVES(totalBolivares)}</strong>
                  </TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        ) : (
          <p className='text-muted-foreground py-6 text-center'>
            {fleteId
              ? 'No hay gastos registrados para este flete'
              : 'No hay gastos generales registrados'}
          </p>
        )}
      </div>

      {/* Componente de formulario de gastos */}
      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentExpense={currentExpense}
        onSubmitSuccess={handleFormSubmitSuccess}
        fleteId={fleteId}
      />

      {/* — Confirmación de borrado — */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <div className='py-4'>
            <p>
              ¿Está seguro que desea eliminar este gasto? Esta acción no se
              puede deshacer.
            </p>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button type='button' variant='destructive' onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ScrollBar orientation='horizontal' />
    </ScrollArea>
  );
}
