/**
 * GoMate Machinery Owner Diesel & Maintenance Expense Repository
 * Manages daily fuel consumption, maintenance costs, operator wages,
 * gross rental income, and net profit calculations.
 */

// In-memory expense logbook store with realistic seed records
let EXPENSE_RECORDS = [
  {
    id: 'EXP-1001',
    owner_phone: '+919822012345',
    equipment_name: 'Mahindra 575 DI (45 HP) [रोटाव्हेटर]',
    date: '2026-08-28',
    hours_worked: 6.0,
    diesel_litres: 21.0,
    diesel_cost: 1995,
    maintenance_cost: 350,
    operator_wages: 500,
    gross_earnings: 4800,
    net_profit: 1955,
    notes: 'शेगाव येथील तुकाराम पाटील यांच्या शेतात रोटाव्हेटर काम'
  },
  {
    id: 'EXP-1002',
    owner_phone: '+919822012345',
    equipment_name: 'Mahindra 575 DI (45 HP) [नांगरट]',
    date: '2026-08-27',
    hours_worked: 8.0,
    diesel_litres: 28.0,
    diesel_cost: 2660,
    maintenance_cost: 400,
    operator_wages: 600,
    gross_earnings: 6800,
    net_profit: 3140,
    notes: 'जत परिसरातील ५ एकर काळी जमीन खोल नांगरट'
  },
  {
    id: 'EXP-1003',
    owner_phone: '+919822012345',
    equipment_name: 'JCB 3DX Super EcoXcellence',
    date: '2026-08-26',
    hours_worked: 7.5,
    diesel_litres: 34.0,
    diesel_cost: 3230,
    maintenance_cost: 650,
    operator_wages: 800,
    gross_earnings: 7125,
    net_profit: 2445,
    notes: 'डफळापूर शेततळे चर खोदकाम'
  }
];

const supabase = require('./supabase');

/**
 * Get all expense logs for a specific owner phone
 */
async function getOwnerExpenses(ownerPhone) {
  const cleanPhone = String(ownerPhone).trim().replace(/[^\d+]/g, '');
  let logs = [];

  try {
    const { data, error } = await supabase
      .from('expense_logs')
      .select('*')
      .eq('owner_phone', cleanPhone)
      .order('date', { ascending: false });
    if (!error && data && data.length > 0) {
      logs = data;
    }
  } catch (err) {
    // fallback to memory
  }

  if (logs.length === 0) {
    logs = EXPENSE_RECORDS.filter(r => r.owner_phone === cleanPhone || cleanPhone.includes(r.owner_phone.slice(-10)));
  }

  // Compute aggregated KPI stats
  const totalGross = logs.reduce((sum, r) => sum + (Number(r.gross_earnings) || 0), 0);
  const totalDieselCost = logs.reduce((sum, r) => sum + (Number(r.diesel_cost) || 0), 0);
  const totalDieselLitres = logs.reduce((sum, r) => sum + (Number(r.diesel_litres) || 0), 0);
  const totalMaintenance = logs.reduce((sum, r) => sum + (Number(r.maintenance_cost) || 0), 0);
  const totalWages = logs.reduce((sum, r) => sum + (Number(r.operator_wages) || 0), 0);
  const totalHours = logs.reduce((sum, r) => sum + (Number(r.hours_worked) || 0), 0);
  const totalNetProfit = totalGross - (totalDieselCost + totalMaintenance + totalWages);
  
  const avgDieselPerHour = totalHours > 0 ? Math.round((totalDieselLitres / totalHours) * 10) / 10 : 3.4;

  return {
    logs,
    summary: {
      totalGross,
      totalDieselCost,
      totalDieselLitres,
      totalMaintenance,
      totalWages,
      totalHours,
      totalNetProfit,
      avgDieselPerHour,
      profitMarginPercent: totalGross > 0 ? Math.round((totalNetProfit / totalGross) * 100) : 0
    }
  };
}

/**
 * Add a new expense record
 */
async function addExpenseRecord(data) {
  const hours = Number(data.hours_worked) || 1;
  const litres = Number(data.diesel_litres) || (hours * 3.5);
  const dieselCost = Number(data.diesel_cost) || (litres * 95);
  const maintCost = Number(data.maintenance_cost) || 0;
  const wages = Number(data.operator_wages) || 0;
  const gross = Number(data.gross_earnings) || (hours * 800);
  const net = gross - (dieselCost + maintCost + wages);

  const newRecord = {
    id: `EXP-${Date.now().toString().slice(-6)}`,
    owner_phone: data.owner_phone || '+919822012345',
    equipment_name: data.equipment_name || 'Mahindra 575 DI (45 HP)',
    date: data.date || new Date().toISOString().split('T')[0],
    hours_worked: hours,
    diesel_litres: litres,
    diesel_cost: dieselCost,
    maintenance_cost: maintCost,
    operator_wages: wages,
    gross_earnings: gross,
    net_profit: net,
    notes: data.notes || 'शेती काम'
  };

  try {
    const { data: dbData, error } = await supabase
      .from('expense_logs')
      .insert([newRecord])
      .select()
      .single();
    if (!error && dbData) {
      EXPENSE_RECORDS.unshift(dbData);
      return dbData;
    }
  } catch (err) {
    // fallback
  }

  EXPENSE_RECORDS.unshift(newRecord);
  return newRecord;
}

/**
 * Delete an expense record
 */
async function deleteExpenseRecord(id) {
  try {
    await supabase.from('expense_logs').delete().eq('id', id);
  } catch (err) {
    // fallback
  }
  const initialLen = EXPENSE_RECORDS.length;
  EXPENSE_RECORDS = EXPENSE_RECORDS.filter(r => r.id !== id);
  return EXPENSE_RECORDS.length < initialLen;
}

module.exports = {
  getOwnerExpenses,
  addExpenseRecord,
  deleteExpenseRecord
};
