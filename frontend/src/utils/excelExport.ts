/**
 * excelExport.ts
 * Pure TypeScript Excel export utility — zero dependencies.
 * Generates Excel 2003 XML SpreadsheetML (.xls) files as Blobs,
 * which are natively opened by Microsoft Excel, Google Sheets & LibreOffice.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentProjectRow {
  studentName: string;
  universityId: string;
  department: string;
  projectTitle: string;
  technologies: string;
  status: string;
  progress: number;
  supervisor: string;
  batch: string;
  startDate: string;
  endDate: string;
  milestonesTotal: number;
  milestonesApproved: number;
}

export interface GradeRow {
  studentName: string;
  projectTitle: string;
  score: number | string;
  grade: string;
  status: string;
  supervisorFeedback: string;
  gradedAt: string;
  codeQuality: number | string;
  documentation: number | string;
  presentation: number | string;
  innovation: number | string;
  teamwork: number | string;
}

// ─── XML Helpers ──────────────────────────────────────────────────────────────

function escapeXml(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cell(value: unknown, type: 'String' | 'Number' = 'String'): string {
  const escaped = escapeXml(value);
  if (type === 'Number' && escaped !== '' && !isNaN(Number(escaped))) {
    return `<Cell><Data ss:Type="Number">${escaped}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${escaped}</Data></Cell>`;
}

function headerCell(value: string): string {
  return `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
}

function groupHeaderCell(value: string, span: number): string {
  return `<Cell ss:StyleID="groupHeader" ss:MergeAcross="${span - 1}"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
}

function row(...cells: string[]): string {
  return `<Row>${cells.join('')}</Row>`;
}

// ─── Workbook wrapper ─────────────────────────────────────────────────────────

function buildWorkbook(sheets: { name: string; content: string }[]): string {
  const styles = `
<Styles>
  <Style ss:ID="header">
    <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="10" ss:FontName="Segoe UI"/>
    <Interior ss:Color="#0F2A38" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1A4454"/>
    </Borders>
  </Style>
  <Style ss:ID="groupHeader">
    <Font ss:Bold="1" ss:Color="#0E4A5E" ss:Size="11" ss:FontName="Segoe UI"/>
    <Interior ss:Color="#E0F0F5" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="even">
    <Interior ss:Color="#F8FCFD" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="badge_green">
    <Font ss:Color="#15803D" ss:Bold="1" ss:FontName="Segoe UI"/>
    <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="badge_blue">
    <Font ss:Color="#0369A1" ss:Bold="1" ss:FontName="Segoe UI"/>
    <Interior ss:Color="#E0F2FE" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="badge_yellow">
    <Font ss:Color="#B45309" ss:Bold="1" ss:FontName="Segoe UI"/>
    <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="badge_red">
    <Font ss:Color="#B91C1C" ss:Bold="1" ss:FontName="Segoe UI"/>
    <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="title">
    <Font ss:Bold="1" ss:Size="14" ss:Color="#0F2A38" ss:FontName="Segoe UI"/>
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="subtitle">
    <Font ss:Italic="1" ss:Size="9" ss:Color="#64748B" ss:FontName="Segoe UI"/>
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
</Styles>`;

  const sheetsXml = sheets
    .map(
      s => `
  <Worksheet ss:Name="${escapeXml(s.name)}">
    <Table ss:DefaultRowHeight="20">
      ${s.content}
    </Table>
  </Worksheet>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Author>GiteaForge LMS</Author>
    <Title>GiteaForge Academic Export</Title>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>
  ${styles}
  ${sheetsXml}
</Workbook>`;
}

function downloadXls(xmlContent: string, filename: string): void {
  const blob = new Blob([xmlContent], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xls') ? filename : `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function statusCellStyled(status: string): string {
  const s = String(status || '').toUpperCase();
  let styleId = '';
  if (s === 'APPROVED' || s === 'COMPLETED') styleId = 'badge_green';
  else if (s === 'IN_PROGRESS' || s === 'ACTIVE') styleId = 'badge_blue';
  else if (s === 'SUBMITTED' || s === 'PENDING') styleId = 'badge_yellow';
  else if (s === 'REJECTED' || s === 'ARCHIVED') styleId = 'badge_red';

  if (styleId) {
    return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(status)}</Data></Cell>`;
  }
  return cell(status);
}

// ─── Student-wise export ──────────────────────────────────────────────────────

const STUDENT_HEADERS = [
  'Student Name',
  'University ID',
  'Department',
  'Project Title',
  'Technologies',
  'Status',
  'Progress %',
  'Supervisor',
  'Batch',
  'Start Date',
  'End Date',
  'Milestones Total',
  'Milestones Approved',
];

function buildStudentRow(p: StudentProjectRow, idx: number): string {
  const style = idx % 2 === 0 ? '' : ' ss:StyleID="even"';
  return `<Row${style}>
    ${cell(p.studentName)}
    ${cell(p.universityId)}
    ${cell(p.department)}
    ${cell(p.projectTitle)}
    ${cell(p.technologies)}
    ${statusCellStyled(p.status)}
    ${cell(p.progress, 'Number')}
    ${cell(p.supervisor)}
    ${cell(p.batch)}
    ${cell(p.startDate)}
    ${cell(p.endDate)}
    ${cell(p.milestonesTotal, 'Number')}
    ${cell(p.milestonesApproved, 'Number')}
  </Row>`;
}

export function exportStudentProjectsToExcel(
  projects: StudentProjectRow[],
  filename = `student_project_updates_${_dateStamp()}.xls`,
): void {
  if (projects.length === 0) {
    alert('No projects to export.');
    return;
  }

  const headerRow = row(...STUDENT_HEADERS.map(headerCell));
  const dataRows = projects.map((p, i) => buildStudentRow(p, i)).join('\n');

  const metaRow = `<Row>
    <Cell ss:StyleID="title"><Data ss:Type="String">GiteaForge LMS — Student Project Updates</Data></Cell>
  </Row>
  <Row>
    <Cell ss:StyleID="subtitle"><Data ss:Type="String">Exported: ${new Date().toLocaleString()}</Data></Cell>
  </Row>
  <Row/>`;

  const sheetContent = `
    ${metaRow}
    ${headerRow}
    ${dataRows}
  `;

  const xml = buildWorkbook([{ name: 'Student Projects', content: sheetContent }]);
  downloadXls(xml, filename);
}

// ─── Group-wise (batch) export ────────────────────────────────────────────────

export function exportGroupProjectsToExcel(
  projects: StudentProjectRow[],
  filename = `group_project_updates_${_dateStamp()}.xls`,
): void {
  if (projects.length === 0) {
    alert('No projects to export.');
    return;
  }

  // Group by batch
  const byBatch = new Map<string, StudentProjectRow[]>();
  for (const p of projects) {
    const batchName = p.batch || 'Unassigned';
    if (!byBatch.has(batchName)) byBatch.set(batchName, []);
    byBatch.get(batchName)!.push(p);
  }

  const sortedBatches = Array.from(byBatch.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  let rowIdx = 0;
  const rows: string[] = [];

  const metaRow = `<Row>
    <Cell ss:StyleID="title"><Data ss:Type="String">GiteaForge LMS — Group-wise Project Updates</Data></Cell>
  </Row>
  <Row>
    <Cell ss:StyleID="subtitle"><Data ss:Type="String">Exported: ${new Date().toLocaleString()}</Data></Cell>
  </Row>
  <Row/>`;

  rows.push(metaRow);

  for (const [batchName, batchProjects] of sortedBatches) {
    rows.push(
      `<Row>${groupHeaderCell(`📁 Batch: ${batchName}  (${batchProjects.length} project${batchProjects.length !== 1 ? 's' : ''})`, STUDENT_HEADERS.length)}</Row>`,
    );
    rows.push(row(...STUDENT_HEADERS.map(headerCell)));
    for (const p of batchProjects) {
      rows.push(buildStudentRow(p, rowIdx));
      rowIdx++;
    }
    rows.push('<Row/>');
  }

  const xml = buildWorkbook([{ name: 'Group Projects', content: rows.join('\n') }]);
  downloadXls(xml, filename);
}

// ─── Supervisor grades export ─────────────────────────────────────────────────

const GRADE_HEADERS = [
  'Student Name',
  'Project Title',
  'Score (/100)',
  'Grade',
  'Project Status',
  'Supervisor Feedback',
  'Graded On',
  'Code Quality',
  'Documentation',
  'Presentation',
  'Innovation',
  'Teamwork',
];

function gradeCellStyled(grade: string, score: number | string): string {
  const s = Number(score);
  let styleId = '';
  if (s >= 80 || grade.startsWith('A')) styleId = 'badge_green';
  else if (s >= 65 || grade.startsWith('B')) styleId = 'badge_blue';
  else if (s >= 50 || grade.startsWith('C')) styleId = 'badge_yellow';
  else if (s > 0 || grade.startsWith('F')) styleId = 'badge_red';

  if (styleId) {
    return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(grade)}</Data></Cell>`;
  }
  return cell(grade);
}

export function exportGradesToExcel(
  grades: GradeRow[],
  filename = `supervisor_grades_${_dateStamp()}.xls`,
): void {
  if (grades.length === 0) {
    alert('No grades to export.');
    return;
  }

  const metaRow = `<Row>
    <Cell ss:StyleID="title"><Data ss:Type="String">GiteaForge LMS — Supervisor Grading Report</Data></Cell>
  </Row>
  <Row>
    <Cell ss:StyleID="subtitle"><Data ss:Type="String">Exported: ${new Date().toLocaleString()}</Data></Cell>
  </Row>
  <Row/>`;

  const headerRow = row(...GRADE_HEADERS.map(headerCell));

  const dataRows = grades.map((g, i) => {
    const style = i % 2 === 0 ? '' : ' ss:StyleID="even"';
    return `<Row${style}>
      ${cell(g.studentName)}
      ${cell(g.projectTitle)}
      ${cell(g.score, 'Number')}
      ${gradeCellStyled(g.grade, g.score)}
      ${statusCellStyled(g.status)}
      ${cell(g.supervisorFeedback)}
      ${cell(g.gradedAt)}
      ${cell(g.codeQuality, 'Number')}
      ${cell(g.documentation, 'Number')}
      ${cell(g.presentation, 'Number')}
      ${cell(g.innovation, 'Number')}
      ${cell(g.teamwork, 'Number')}
    </Row>`;
  });

  // Summary stats row
  const avgScore =
    grades.length > 0
      ? Math.round(
          grades.reduce((sum, g) => sum + Number(g.score || 0), 0) /
            grades.length,
        )
      : 0;

  const summaryRow = `<Row/>
  <Row>
    <Cell ss:StyleID="header"><Data ss:Type="String">Summary</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="String">Total Students</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="Number">${grades.length}</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="String">Avg Score</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="Number">${avgScore}</Data></Cell>
  </Row>`;

  const sheetContent = `${metaRow}${headerRow}${dataRows.join('\n')}${summaryRow}`;

  const xml = buildWorkbook([{ name: 'Grades Report', content: sheetContent }]);
  downloadXls(xml, filename);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _dateStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
