import { Router, Request, Response } from 'express';

// ONDC protocol contract stub — mounted ONLY when ENABLE_ONDC=true (see
// index.ts). Purpose: reserve the on_search / on_select / on_init / on_confirm
// request shape so a real gateway can be dropped in without API breakage.
const router = Router();

router.get('/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      enabled: true,
      provider: 'ondc-stub',
      version: '1.0.0',
      supportedActions: ['on_search', 'on_select', 'on_init', 'on_confirm', 'on_status', 'on_cancel'],
    },
  });
});

router.post('/on_search', (req: Request, res: Response) => {
  const context = (req.body && req.body.context) || {};
  res.json({
    context: {
      action: 'on_search',
      domain: 'ONDC:RET10',
      country: 'IND',
      city: context.city || '*',
      core_version: '1.2.0',
      transaction_id: context.transaction_id,
      message_id: context.message_id,
      bap_id: context.bap_id,
      bap_uri: context.bap_uri,
    },
    message: {
      catalog: { descriptor: { name: 'Chiti Bazaar' }, providers: [] },
    },
  });
});

export default router;
