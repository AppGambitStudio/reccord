import { Suspense } from 'react';
import Recorder from '@/components/Recorder';

export default function RecordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Recorder />
        </Suspense>
    );
}
