-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrolmentLog" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "districtId" TEXT NOT NULL,
    "count_0_5" INTEGER NOT NULL DEFAULT 0,
    "count_5_17" INTEGER NOT NULL DEFAULT 0,
    "count_18_plus" INTEGER NOT NULL DEFAULT 0,
    "bio_update_child" INTEGER NOT NULL DEFAULT 0,
    "bio_update_adult" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EnrolmentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnomalyEvent" (
    "id" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateOfEvent" TIMESTAMP(3) NOT NULL,
    "districtId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "zScore" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "AnomalyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "District_pincode_key" ON "District"("pincode");

-- CreateIndex
CREATE INDEX "District_state_name_idx" ON "District"("state", "name");

-- CreateIndex
CREATE INDEX "EnrolmentLog_date_idx" ON "EnrolmentLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "EnrolmentLog_districtId_date_key" ON "EnrolmentLog"("districtId", "date");

-- AddForeignKey
ALTER TABLE "EnrolmentLog" ADD CONSTRAINT "EnrolmentLog_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnomalyEvent" ADD CONSTRAINT "AnomalyEvent_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
