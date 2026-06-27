const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'Mays', 'MAYS-SRM-FE', 'src', 'pages', 'Tickets', 'TicketDetailPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update createTimelineEntry
content = content.replace(
`const createTimelineEntry = (log) => {
  const actor = log?.assignorEmployeeName || 'System';
  const timestamp = formatTimestamp(log?.modificationDate);

  let actionParts = [];

  if (log?.oldStatus && log?.newStatus && log.oldStatus !== log.newStatus) {
    actionParts.push(\`Status updated from \${log.oldStatus} to \${log.newStatus}\`);
  }

  if (log?.assigneeEmployeeName) {
    actionParts.push(\`Assigned to \${log.assigneeEmployeeName}\`);
  }

  if (log?.assignorRemarks) {
    actionParts.push(\`Remarks: \${log.assignorRemarks}\`);
  }

  const action = actionParts.length > 0 ? actionParts.join(' | ') : 'Ticket updated';

  return {
    user: actor,
    action,
    timestamp,
    type: 'update',
  };
};`,
`const createTimelineEntry = (log) => {
  const actor = log?.modifiedBy || log?.assignorEmployeeName || 'System';
  const timestamp = formatTimestamp(log?.modificationDate);

  let actionParts = [];

  if (log?.status) {
    actionParts.push(\`Status updated to \${log.status}\`);
  } else if (log?.oldStatus && log?.newStatus && log.oldStatus !== log.newStatus) {
    actionParts.push(\`Status updated from \${log.oldStatus} to \${log.newStatus}\`);
  }

  if (log?.assigneeEmployeeName) {
    actionParts.push(\`Assigned to \${log.assigneeEmployeeName}\`);
  }

  if (log?.assignorRemarks) {
    actionParts.push(\`Remarks: \${log.assignorRemarks}\`);
  }

  const action = actionParts.length > 0 ? actionParts.join(' | ') : 'Ticket updated';

  return {
    user: actor,
    action,
    timestamp,
    type: 'update',
  };
};`
);

// 2. Add Modal state
content = content.replace(
  "const [lightboxImg, setLightboxImg] = useState(null);",
  "const [lightboxImg, setLightboxImg] = useState(null);\n  const [logDetailModalOpen, setLogDetailModalOpen] = useState(false);\n  const [fullLogs, setFullLogs] = useState([]);\n\n  useEffect(() => {\n    if (logDetailModalOpen) {\n      api.get(`/ticket-logs/${id}`).then(res => setFullLogs(res.data)).catch(console.error);\n    }\n  }, [logDetailModalOpen, id]);"
);

// 3. Update loadTicketDetails fetch
content = content.replace(
  "api.get(`/ticket-logs/${id}`),",
  "api.get(`/ticket-logs/${id}/latest`),"
);

// 4. Update filtering
content = content.replace(
  `      const filteredLogs = Array.isArray(logsData)
        ? logsData
          .filter(
            (log) => Number(log?.ticketId) === currentTicketId
          )
          .map(createTimelineEntry)
        : [];`,
  `      const filteredLogs = Array.isArray(logsData)
        ? logsData.map(createTimelineEntry)
        : [];`
);

// 5. Replace put with patch and add modifiedByEmployeeId for handleSaveClick
content = content.replace(
  `        ticketStatusName: selectedStatus ? (selectedStatus.statusName || selectedStatus.name) : ticket?.ticketStatusName,
      };

      await api.put(\`/tickets/\${id}\`, updatedTicket);`,
  `        ticketStatusName: selectedStatus ? (selectedStatus.statusName || selectedStatus.name) : ticket?.ticketStatusName,
        modifiedByEmployeeId: user?.employeeId || user?.id || null,
        remarks: 'Ticket status/assignee updated'
      };

      await api.patch(\`/tickets/\${id}\`, updatedTicket);`
);

// 6. Replace put with patch for handleSaveCustomer
content = content.replace(
  `      const updatedTicket = {
        ...ticket,
        userRefNo: selectedCustomer ? String(selectedCustomer.userId) : ticket?.userRefNo,
      };
      await api.put(\`/tickets/\${id}\`, updatedTicket);`,
  `      const updatedTicket = {
        ...ticket,
        userRefNo: selectedCustomer ? String(selectedCustomer.userId) : ticket?.userRefNo,
        modifiedByEmployeeId: user?.employeeId || user?.id || null,
        remarks: 'Customer updated'
      };
      await api.patch(\`/tickets/\${id}\`, updatedTicket);`
);

// 7. Replace put with patch for handleSaveDevice
content = content.replace(
  `      const updatedTicket = {
        ...ticket,
        deviceSerialNo: editDeviceForm.serialNo,
        deviceModelId: editDeviceForm.modelId || null,
        customModelName: editDeviceForm.customModelName || null,
        brandId: editDeviceForm.brandId || null,
        warrantyType: editDeviceForm.warrantyType || null,
      };

      await api.put(\`/tickets/\${id}\`, updatedTicket);`,
  `      const updatedTicket = {
        ...ticket,
        deviceSerialNo: editDeviceForm.serialNo,
        deviceModelId: editDeviceForm.modelId || null,
        customModelName: editDeviceForm.customModelName || null,
        brandId: editDeviceForm.brandId || null,
        warrantyType: editDeviceForm.warrantyType || null,
        modifiedByEmployeeId: user?.employeeId || user?.id || null,
        remarks: 'Device updated'
      };

      await api.patch(\`/tickets/\${id}\`, updatedTicket);`
);

// 8. Replace put with patch for handleSaveDescription
content = content.replace(
  `      const updatedTicket = {
        ...ticket,
        ticketDescription: tempDescription,
      };
      await api.put(\`/tickets/\${id}\`, updatedTicket);`,
  `      const updatedTicket = {
        ...ticket,
        ticketDescription: tempDescription,
        modifiedByEmployeeId: user?.employeeId || user?.id || null,
        remarks: 'Description updated'
      };
      await api.patch(\`/tickets/\${id}\`, updatedTicket);`
);

// 9. Update Activity Timeline heading
content = content.replace(
  `<Box sx={{ px: 2.5, py: 1.8 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Activity Timeline</Typography>
            </Box>`,
  `<Box sx={{ px: 2.5, py: 1.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Activity Timeline</Typography>
              <Typography 
                 component="span" 
                 sx={{ fontSize: '12px', color: theme.palette.primary.main, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                 onClick={() => setLogDetailModalOpen(true)}
              >
                 See more
              </Typography>
            </Box>`
);

// 10. Add Log Detail Modal at the bottom
content = content.replace(
  `{/* Lightbox Dialog */}`,
  `{/* Log Detail Modal */}
      <Dialog open={logDetailModalOpen} onClose={() => setLogDetailModalOpen(false)} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Full Ticket Logs</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '60vh', overflowY: 'auto' }}>
            {fullLogs.length === 0 ? (
              <Typography>No logs found.</Typography>
            ) : (
              fullLogs.map((log, i) => (
                <Box key={i} sx={{ p: 2, border: '1px solid', borderColor: theme.palette.divider, borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                    Modified By: {log.modifiedBy || 'System'} 
                    <Typography component="span" sx={{ color: theme.palette.text.secondary, ml: 1, fontSize: '12px', fontWeight: 400 }}>
                      ({formatTimestamp(log.modificationDate)})
                    </Typography>
                  </Typography>
                  {log.assignorRemarks && (
                    <Typography variant="body2" sx={{ mt: 1, color: theme.palette.text.secondary }}>
                      <b>Remarks:</b> {log.assignorRemarks}
                    </Typography>
                  )}
                  {log.changedFields && (() => {
                    try {
                      const changes = JSON.parse(log.changedFields);
                      return (
                        <Box sx={{ mt: 1.5, p: 1.5, bgcolor: theme.palette.action.hover, borderRadius: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>CHANGES:</Typography>
                          {Object.entries(changes).map(([field, vals]) => (
                            <Typography key={field} variant="body2" sx={{ fontSize: '13px', display: 'flex', gap: 1, mb: 0.5 }}>
                              <Box component="span" sx={{ fontWeight: 500, minWidth: '120px' }}>{field}</Box>
                              <Box component="span" sx={{ color: theme.palette.error.main, textDecoration: 'line-through' }}>{String(vals.old)}</Box>
                              <Box component="span" sx={{ color: theme.palette.text.secondary }}>&rarr;</Box>
                              <Box component="span" sx={{ color: theme.palette.success.main }}>{String(vals.new)}</Box>
                            </Typography>
                          ))}
                        </Box>
                      );
                    } catch (e) {
                      return <Typography variant="body2" sx={{ mt: 1 }}>{log.changedFields}</Typography>;
                    }
                  })()}
                </Box>
              ))
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Lightbox Dialog */}`
);

fs.writeFileSync(filePath, content);
console.log("Successfully patched TicketDetailPage.jsx");
