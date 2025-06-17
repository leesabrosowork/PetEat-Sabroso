// @desc    Delete EMR
// @route   DELETE /api/emr/:id
// @access  Private/Doctor
exports.deleteEMR = async (req, res) => {
    try {
        const emr = await EMR.findByIdAndDelete(req.params.id);
        if (!emr) {
            return res.status(404).json({
                success: false,
                message: 'EMR not found'
            });
        }
        res.json({
            success: true,
            message: 'EMR deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting EMR',
            error: error.message
        });
    }
};
