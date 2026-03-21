package com.example.yaya.ui.screens.onboarding

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class OnboardingStepManagerTest {

    private lateinit var stepManager: OnboardingStepManager

    @Before
    fun setup() {
        stepManager = OnboardingStepManager()
    }

    // ── Validation ──────────────────────────────

    @Test
    fun `validate returns error when business type is blank`() {
        val state = OnboardingUiState(step = OnboardingStep.BUSINESS_TYPE, businessType = "")
        assertNotNull(stepManager.validate(state))
    }

    @Test
    fun `validate passes when business type is set`() {
        val state = OnboardingUiState(step = OnboardingStep.BUSINESS_TYPE, businessType = "restaurant")
        assertNull(stepManager.validate(state))
    }

    @Test
    fun `validate returns error when business name is blank`() {
        val state = OnboardingUiState(
            step = OnboardingStep.BUSINESS_INFO,
            businessName = "",
            phoneNumber = "987654321"
        )
        assertNotNull(stepManager.validate(state))
    }

    @Test
    fun `validate returns error when phone is blank`() {
        val state = OnboardingUiState(
            step = OnboardingStep.BUSINESS_INFO,
            businessName = "Mi Negocio",
            phoneNumber = ""
        )
        assertNotNull(stepManager.validate(state))
    }

    @Test
    fun `validate passes for complete business info`() {
        val state = OnboardingUiState(
            step = OnboardingStep.BUSINESS_INFO,
            businessName = "Mi Negocio",
            phoneNumber = "987654321"
        )
        assertNull(stepManager.validate(state))
    }

    @Test
    fun `validate returns null for steps without validation`() {
        assertNull(stepManager.validate(OnboardingUiState(step = OnboardingStep.WELCOME)))
        assertNull(stepManager.validate(OnboardingUiState(step = OnboardingStep.DONE)))
    }

    // ── Navigation ──────────────────────────────

    @Test
    fun `nextStep advances from WELCOME to BUSINESS_TYPE`() {
        val result = stepManager.nextStep(OnboardingStep.WELCOME)
        assertNotNull(result)
        assertEquals(OnboardingStep.BUSINESS_TYPE, result!!.step)
        assertEquals(1, result.index)
    }

    @Test
    fun `nextStep returns null at DONE`() {
        assertNull(stepManager.nextStep(OnboardingStep.DONE))
    }

    @Test
    fun `previousStep returns null at WELCOME`() {
        assertNull(stepManager.previousStep(OnboardingStep.WELCOME))
    }

    @Test
    fun `previousStep goes back from BUSINESS_TYPE to WELCOME`() {
        val result = stepManager.previousStep(OnboardingStep.BUSINESS_TYPE)
        assertNotNull(result)
        assertEquals(OnboardingStep.WELCOME, result!!.step)
        assertEquals(0, result.index)
    }

    // ── Skip ────────────────────────────────────

    @Test
    fun `canSkip returns true for WhatsApp and first product`() {
        assertTrue(stepManager.canSkip(OnboardingStep.WHATSAPP_CONNECTION))
        assertTrue(stepManager.canSkip(OnboardingStep.FIRST_PRODUCT))
    }

    @Test
    fun `canSkip returns false for required steps`() {
        assertFalse(stepManager.canSkip(OnboardingStep.WELCOME))
        assertFalse(stepManager.canSkip(OnboardingStep.BUSINESS_TYPE))
        assertFalse(stepManager.canSkip(OnboardingStep.BUSINESS_INFO))
        assertFalse(stepManager.canSkip(OnboardingStep.ACCOUNT_CREATION))
        assertFalse(stepManager.canSkip(OnboardingStep.NOTIFICATION_ACCESS))
        assertFalse(stepManager.canSkip(OnboardingStep.DONE))
    }
}
