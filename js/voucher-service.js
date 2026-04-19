// js/voucher-service.js
import { db } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit,
    doc,
    updateDoc,
    deleteDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function getNextVoucherCode(type) {
    const vouchersRef = collection(db, 'vouchers');
    // Query by voucherType and order by voucherNumber (numeric) descending
    const q = query(
        vouchersRef, 
        where('voucherType', '==', type),
        orderBy('voucherNumber', 'desc'),
        limit(1)
    );
    
    try {
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return { code: `${type}/001`, number: 1 };
        } else {
            const lastVoucher = snapshot.docs[0].data();
            const lastNumber = lastVoucher.voucherNumber || 1;
            const nextNumber = lastNumber + 1;
            const nextCode = `${type}/${nextNumber.toString().padStart(3, '0')}`;
            return { code: nextCode, number: nextNumber };
        }
    } catch (error) {
        // If index is missing, fallback to client-side sorting (temporary)
        console.warn('Index not ready, using fallback method:', error.message);
        const fallbackSnapshot = await getDocs(collection(db, 'vouchers'));
        const typeVouchers = fallbackSnapshot.docs
            .map(doc => doc.data())
            .filter(v => v.voucherType === type)
            .sort((a, b) => (b.voucherNumber || 0) - (a.voucherNumber || 0));
        
        if (typeVouchers.length === 0) {
            return { code: `${type}/001`, number: 1 };
        } else {
            const lastNumber = typeVouchers[0].voucherNumber || 1;
            const nextNumber = lastNumber + 1;
            return { code: `${type}/${nextNumber.toString().padStart(3, '0')}`, number: nextNumber };
        }
    }
}

export async function saveVoucher(voucherData) {
    try {
        const { code: voucherCode, number: voucherNumber } = await getNextVoucherCode(voucherData.voucherType);
        const fullVoucher = {
            ...voucherData,
            voucherCode,
            voucherNumber,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, 'vouchers'), fullVoucher);
        return { id: docRef.id, ...fullVoucher };
    } catch (error) {
        console.error('Error saving voucher:', error);
        throw error;
    }
}

export async function getVouchers(filters = {}) {
    let q = collection(db, 'vouchers');
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateVoucher(id, voucherData) {
    const docRef = doc(db, 'vouchers', id);
    await updateDoc(docRef, {
        ...voucherData,
        updatedAt: new Date().toISOString()
    });
}

export async function deleteVoucher(id) {
    await deleteDoc(doc(db, 'vouchers', id));
}

export async function getVoucher(id) {
    const docRef = doc(db, 'vouchers', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
}