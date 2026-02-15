import { CommonModule } from '@angular/common';
import { Component, computed, effect, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { finalize } from 'rxjs';
import { DoctorService } from '../../../core/service/doctorService';
import { AppointmentDto, AppointStatus, DoctorDto } from '../../../model/models';

interface Slot {
    id: string;
    startAt: string;
    endAt: string;
    durationMin: number;
    priceEUR?: number;
}

interface DoctorAvailability {
    doctorId: string;
    doctorName: string;
    specialty: string;
    clinic: string;
    nextAvailableAt: string;
    slots: Slot[];
}

@Component({
    selector: 'app-user-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './user.component.html',
    styleUrl: './user.component.css',
})
export class UserDashboard {
    

    private readonly WORK_START_HOUR = 9;
    private readonly WORK_END_HOUR = 17;
    private readonly SLOT_MINUTES = 30;

    showWarning:boolean = false;
    warningMessage:string = '';

    loadingMy = signal(false);
    loadingAvail = signal(false);

    query = signal('');
    specialty = signal<string | 'All'>('All');
    onlyAvailable = signal(false);

    activeTab = signal<'MY' | 'AVAILABLE'>('MY');

    selectedDate = signal<Date>(new Date());

    selectedDateISO = computed(() => {
        const d = this.selectedDate();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    });

    selectedDateLabel = computed(() => this.selectedDateISO());

    private dayRange = computed(() => {
        const d = this.selectedDate();
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return { start, end };
    });

    myAppointments = signal<AppointmentDto[]>([]);
    availability = signal<DoctorAvailability[]>([]);
    private doctors = signal<DoctorDto[]>([]);

    specialties = computed(() => {
        const set = new Set<string>();
        for (const d of this.availability()) set.add(d.specialty);
        for (const a of this.myAppointments()) set.add(a.doctorDto?.doctorSpecialty ?? 'Unknown');
        return ['All', ...Array.from(set).sort()] as const;
    });

    filteredMy = computed(() => {
        const q = this.query().trim().toLowerCase();
        const s = this.specialty();

        return this.myAppointments()
            .filter(a => (s === 'All' ? true : a.doctorDto?.doctorSpecialty === s))
            .filter(a => {
                if (!q) return true;
                return (
                    (a.doctorDto?.doctorName?.toLowerCase().includes(q) ?? false) ||
                    (a.doctorDto?.cabinetName?.toLowerCase().includes(q) ?? false) ||
                    (a.doctorDto?.doctorSpecialty?.toLowerCase().includes(q) ?? false)
                );
            })
            .sort((a, b) => +this.parseLocalDateTime(a.startAt) - +this.parseLocalDateTime(b.startAt));
    });

    filteredAvail = computed(() => {
        const q = this.query().trim().toLowerCase();
        const s = this.specialty();
        const only = this.onlyAvailable();

        return this.availability()
            .map(d => ({
                ...d,
                slots: d.slots
                    .filter(sl => (only ? +this.parseLocalDateTime(sl.startAt) > Date.now() : true))
                    .sort((a, b) => +this.parseLocalDateTime(a.startAt) - +this.parseLocalDateTime(b.startAt)),
            }))
            .filter(d => (s === 'All' ? true : d.specialty === s))
            .filter(d => {
                if (!q) return true;
                return (
                    d.doctorName.toLowerCase().includes(q) ||
                    d.clinic.toLowerCase().includes(q) ||
                    d.specialty.toLowerCase().includes(q)
                );
            })
            .filter(d => (only ? d.slots.length > 0 : true))
            .sort((a, b) => +this.parseLocalDateTime(a.nextAvailableAt) - +this.parseLocalDateTime(b.nextAvailableAt));
    });

    filteredAvailByDate = computed(() => {
        const { start, end } = this.dayRange();
        return this.filteredAvail()
            .map(d => {
                const slotsToday = d.slots
                    .filter(s => {
                        const t = this.parseLocalDateTime(s.startAt);
                        return t >= start && t < end;
                    })
                    .sort((a, b) => +this.parseLocalDateTime(a.startAt) - +this.parseLocalDateTime(b.startAt));

                return {
                    ...d,
                    slots: slotsToday,
                    nextAvailableAt: slotsToday.length ? slotsToday[0].startAt : d.nextAvailableAt,
                };
            })
            .filter(d => d.slots.length > 0);
    });

    upcomingCount = computed(() => this.myAppointments().filter(a => a.status?.toString() === 'RESERVED').length);

    constructor(private doctorService: DoctorService) {
        void this.loadDoctors();
        void this.loadMyAppointments();

        effect(() => {
            const day = this.selectedDate();
            if (this.doctors().length === 0) return;

            void this.loadAvailabilityForDay(day);
        }, { allowSignalWrites: true });
    }

    statusBadgeClass(status: AppointStatus) {
        if (status.toString() === 'RESERVED') return 'badge badge-success badge-outline';
        if (status.toString() === 'CANCELLED') return 'badge badge-ghost';
        return 'badge badge-error badge-outline';
    }

    formatDT(dt: string) {
        const d = this.parseLocalDateTime(dt);
        return d.toLocaleString(undefined, {
            weekday: 'short',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    onDateChange(iso: string) {
        if (!iso) return;
        const [y, m, d] = iso.split('-').map(Number);
        this.selectedDate.set(new Date(y, m - 1, d));
    }

    resetDateToToday() {
        this.selectedDate.set(new Date());
    }

    private async loadDoctors() {
        this.loadingAvail.set(true);

        this.doctorService.getAllDoctors().subscribe({
            next: (response) => {
                if (response.status === 200) {
                    this.doctors.set(Array.isArray(response.body) ? response.body : []);
                }
            }
        });

        try {
        } catch (e) {
            console.error('loadDoctors failed', e);
            this.doctors.set([]);
            this.availability.set([]);
        } finally {
            this.loadingAvail.set(false);
        }
    }

    private loadAvailabilityForDay(day: Date) {
        this.loadingAvail.set(true);
        const { from, to } = this.toFromToLocalDateTime(day);

        const params = new HttpParams()
            .set('from', from)
            .set('to', to);

        const patientId = localStorage.getItem("X-User-Id") ?? "";
        let appts: AppointmentDto[] = [];

        this.doctorService.getAppointmentSlots(from, to)
            .pipe(
                finalize(() => {
                    this.loadingAvail.set(false);
                })
            )
            .subscribe({
                next: (response) => {
                    if (response.status === 200) {
                        appts = Array.isArray(response.body) ? response.body : [];
                        const availability = this.computeAvailabilityB_AllDoctors(
                            this.doctors(),
                            appts ?? [],
                            day,
                            this.WORK_START_HOUR,
                            this.WORK_END_HOUR,
                            this.SLOT_MINUTES
                        );

                        this.availability.set(availability);
                    }
                },
                error: (err) => {
                    console.error('loadAvailabilityForDay failed', err);
                    this.availability.set([]);
                }
            });
    }

    private computeAvailabilityB_AllDoctors(
        doctors: DoctorDto[],
        appts: AppointmentDto[],
        day: Date,
        workStartHour: number,
        workEndHour: number,
        slotMin: number
    ): DoctorAvailability[] {
        const buckets = new Map<string, { doctor: DoctorDto; busy: { start: Date; end: Date }[] }>();
        for (const d of doctors) {
            buckets.set(d.doctorId!, { doctor: d, busy: [] });
        }

        for (const a of appts) {
            if (a.status!.toString() === 'CANCELED') continue;

            const docId = a.doctorDto?.doctorId;
            if (!docId) continue;

            if (!buckets.has(docId)) {
                buckets.set(docId, { doctor: a.doctorDto, busy: [] });
            }

            buckets.get(docId)!.busy.push({
                start: this.parseLocalDateTime(a.startAt),
                end: this.parseLocalDateTime(a.endAt),
            });
        }

        const candidates = this.buildCandidates(day, workStartHour, workEndHour, slotMin);

        const out: DoctorAvailability[] = [];

        for (const [doctorId, entry] of buckets.entries()) {
            const busyRanges = entry.busy
                .filter(r => r.start < r.end)
                .sort((x, y) => +x.start - +y.start);

            const freeSlots: Slot[] = [];

            for (const slotStart of candidates) {
                const slotEnd = new Date(slotStart.getTime() + slotMin * 60_000);
                const taken = busyRanges.some(b => this.overlaps(slotStart, slotEnd, b.start, b.end));
                if (!taken) {
                    freeSlots.push({
                        id: `slot_${doctorId}_${slotStart.getTime()}`,
                        startAt: this.toLocalDateTimeString(slotStart),
                        endAt: this.toLocalDateTimeString(slotEnd),
                        durationMin: slotMin,
                    });
                }
            }

            const next = freeSlots.length
                ? freeSlots[0].startAt
                : this.toLocalDateTimeString(new Date(day));
            out.push({
                doctorId,
                doctorName: entry.doctor.doctorName!,
                specialty: entry.doctor.doctorSpecialty!,
                clinic: entry.doctor.cabinetName ?? 'Unknown Clinic',
                nextAvailableAt: next,
                slots: freeSlots,
            });
        }

        return out.sort(
            (a, b) => +this.parseLocalDateTime(a.nextAvailableAt) - +this.parseLocalDateTime(b.nextAvailableAt)
        );
    }

    book(doctorId: string, slot: Slot) {

        const appList:AppointmentDto[] = this.myAppointments().filter(app => {
            return app.doctorDto.doctorId === doctorId && app.status?.toString() === 'RESERVED';
        });

        const startDateSlot = this.parseLocalDateTime(slot.startAt);

        const alreadyHasAppointment = appList.some(app => {

            const startDateApp = this.parseLocalDateTime(app.startAt);

            return (
                startDateSlot.getDate() === startDateApp.getDate() &&
                startDateSlot.getMonth() === startDateApp.getMonth() &&
                startDateSlot.getFullYear() === startDateApp.getFullYear()
            );
        });

        if (alreadyHasAppointment) {
            
            this.showWarning = true;
            this.warningMessage = 'You already have an appointment with this doctor on the selected date. Cancel the existing appointment before booking a new one.';

            setTimeout(() => {
                this.showWarning = false;
            }, 3000);
        }

        this.loadingAvail.set(true);

        const doctor = this.availability().find(d => d.doctorId === doctorId);
        if (!doctor) {
            this.loadingAvail.set(false);
            return;
        }

        const patientId = localStorage.getItem('X-User-Id') ?? '';

        const newAppt: AppointmentDto = {
            doctorDto: {
                doctorId: doctor.doctorId,
            } as any,
            patientId,
            startAt: slot.startAt,
            endAt: slot.endAt,
        } as any;

        this.doctorService.addAppointment(newAppt)
            .pipe(finalize(() => this.loadingAvail.set(false)))
            .subscribe({
                next: () => {
                    this.refreshAfterBooking();
                    this.activeTab.set('MY');
                },
                error: (err) => {
                    console.error('Booking failed', err);
                }
            });
    }

    cancel(apptId: string) {
        this.loadingMy.set(true);
        this.doctorService.cancelAppointment(apptId)
            .pipe(finalize(() => this.loadingMy.set(false)))
            .subscribe({
                next: () => {
                    this.refreshAfterBooking();
                    this.activeTab.set('MY');
                },
                error: (err) => {
                    console.error('Booking failed', err);
                }
            });
    }

    private parseLocalDateTime(value: string): Date {
        if (!value) return new Date(NaN);

        if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(value)) {
            return new Date(value);
        }

        const m = value.match(
            /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?$/
        );
        if (m) {
            const year = Number(m[1]);
            const month = Number(m[2]) - 1;
            const day = Number(m[3]);
            const hour = Number(m[4]);
            const minute = Number(m[5]);
            const second = m[6] ? Number(m[6]) : 0;
            const ms = m[7] ? Number(m[7].padEnd(3, '0')) : 0;
            return new Date(year, month, day, hour, minute, second, ms);
        }

        return new Date(value);
    }

    private toLocalDateTimeString(d: Date): string {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
    }

    private toFromToLocalDateTime(day: Date): { from: string; to: string } {
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        return {
            from: this.toLocalDateTimeString(start),
            to: this.toLocalDateTimeString(end),
        };
    }

    private buildCandidates(day: Date, workStartHour: number, workEndHour: number, slotMin: number): Date[] {
        const start = new Date(day);
        start.setHours(workStartHour, 0, 0, 0);

        const end = new Date(day);
        end.setHours(workEndHour, 0, 0, 0);

        const out: Date[] = [];
        for (let t = new Date(start); ; t = new Date(t.getTime() + slotMin * 60_000)) {
            const tEnd = new Date(t.getTime() + slotMin * 60_000);
            if (tEnd > end) break;
            out.push(new Date(t));
        }
        return out;
    }

    private overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
        return aStart < bEnd && aEnd > bStart;
    }

    private refreshAfterBooking() {
        void this.loadAvailabilityForDay(this.selectedDate());
        void this.loadMyAppointments();
    }

    private loadMyAppointments() {
        this.loadingMy.set(true);
        const patientId = localStorage.getItem('X-User-Id') ?? '';
        if (!patientId) {
            this.myAppointments.set([]);
            return;
        }
        this.doctorService.getAppointmentByPatient(patientId)
            .pipe(finalize(() => this.loadingMy.set(false)))
            .subscribe({
                next: (response) => {
                    if (response.status === 200) {
                        this.myAppointments.set(Array.isArray(response.body) ? response.body : []);
                    }
                },
                error: (err) => {
                    console.error('loadMyAppointments failed', err);
                    this.myAppointments.set([]);
                },
            });
    }
}
