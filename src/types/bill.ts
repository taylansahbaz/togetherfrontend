export interface UserMini {
    userId: string;
    userName: string;
}

export interface BillItem {
    id: string;
    title: string;
    amount: number;
    responsibleUsers: UserMini[];
}

export interface BillPayment {
    id: string;
    userId: string;
    userName: string;
    amount: number;
}

export interface UserBalance {
    userId: string;
    userName: string;
    owedShare: number;
    paid: number;
    netBalance: number;
}

export interface Transfer {
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    amount: number;
}

export interface Bill {
    id: string;
    placeId: string;
    placeTitle: string;
    groupId?: string | null;
    groupName?: string | null;

    title?: string | null;
    notes?: string | null;
    currency: string;

    totalAmount: number;
    totalPaid: number;

    createdAt: string;
    updatedAt?: string | null;

    items: BillItem[];
    payments: BillPayment[];
    balances: UserBalance[];
    suggestedTransfers: Transfer[];
}

export interface BillItemInput {
    title: string;
    amount: number;
    responsibleUserIds: string[];
}

export interface BillPaymentInput {
    userId: string;
    amount: number;
}

export interface UpsertBillRequest {
    title?: string | null;
    notes?: string | null;
    currency: string;
    items: BillItemInput[];
    payments: BillPaymentInput[];
}

export interface CounterpartyBalance {
    userId: string;
    userName: string;
    netAmount: number;
}

export interface BalanceSummary {
    currency: string;
    totalOwed: number;
    totalOwing: number;
    netBalance: number;
    counterparties: CounterpartyBalance[];
}

export interface MyBillsResponse {
    bills: Bill[];
    balancesByCurrency: BalanceSummary[];
}

export const SUPPORTED_CURRENCIES = [
    { code: "TRY", symbol: "₺", label: "Türk Lirası" },
    { code: "USD", symbol: "$", label: "Amerikan Doları" },
    { code: "EUR", symbol: "€", label: "Euro" },
    { code: "GBP", symbol: "£", label: "İngiliz Sterlini" },
];

export const getCurrencySymbol = (code: string): string => {
    const found = SUPPORTED_CURRENCIES.find(
        (c) => c.code.toUpperCase() === (code || "TRY").toUpperCase()
    );
    return found?.symbol || code || "₺";
};
